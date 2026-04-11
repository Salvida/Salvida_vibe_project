"""
Notification delivery: Web Push and email (Resend).

Both helpers are intentionally fire-and-forget — errors are logged but
never propagate to the caller so that a notification failure never breaks
a booking operation.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from py_vapid import Vapid
from pywebpush import webpush, WebPushException

from config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Web Push
# ---------------------------------------------------------------------------

def send_push(subscription_info: dict, title: str, body: str, data: dict[str, Any] | None = None) -> None:
    """
    Send a Web Push notification to a single browser subscription.

    subscription_info must be:
        {"endpoint": "...", "keys": {"p256dh": "...", "auth": "..."}}
    """
    settings = get_settings()
    if not settings.vapid_private_key or not settings.vapid_public_key:
        logger.debug("VAPID keys not configured — skipping push")
        return

    payload = json.dumps({"title": title, "body": body, **(data or {})})
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_subject},
        )
    except WebPushException as exc:
        # 410 Gone means the subscription has expired/revoked — safe to ignore
        status_code = getattr(exc.response, "status_code", None) if exc.response else None
        if status_code == 410:
            logger.info("Push subscription expired (410): %s", subscription_info.get("endpoint", ""))
        else:
            logger.warning("Push failed (%s): %s", status_code, exc)
    except Exception as exc:
        logger.warning("Unexpected push error: %s", exc)


def send_push_to_user(user_id: str, title: str, body: str, data: dict[str, Any] | None = None) -> None:
    """
    Fetch all push subscriptions for *user_id* and send *title*/*body* to each.
    Requires a synchronous call — safe to use from the APScheduler thread and
    from FastAPI BackgroundTasks.
    """
    from db.supabase_client import get_supabase  # local import avoids circular deps

    supabase = get_supabase()
    result = supabase.table("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user_id).execute()
    for row in result.data or []:
        sub = {"endpoint": row["endpoint"], "keys": {"p256dh": row["p256dh"], "auth": row["auth"]}}
        send_push(sub, title, body, data)


# ---------------------------------------------------------------------------
# Email (Resend)
# ---------------------------------------------------------------------------

async def send_email(to: str, subject: str, html: str) -> None:
    """
    Send a transactional email via the Resend API.
    https://resend.com/docs/api-reference/emails/send-email
    """
    settings = get_settings()
    if not settings.resend_api_key:
        logger.debug("RESEND_API_KEY not configured — skipping email to %s", to)
        return

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={"from": settings.email_from, "to": [to], "subject": subject, "html": html},
            )
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("Email send failed to %s: %s", to, exc)


def send_email_sync(to: str, subject: str, html: str) -> None:
    """Synchronous email send — used from the APScheduler thread."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(send_email(to, subject, html))


# ---------------------------------------------------------------------------
# Email templates
# ---------------------------------------------------------------------------

def booking_reminder_email_html(date: str, start_time: str, prm_name: str = "") -> str:
    prm_line = f"<p>Paciente: <strong>{prm_name}</strong></p>" if prm_name else ""
    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1d4ed8">Recordatorio de reserva</h2>
      <p>Tienes una reserva programada para mañana:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#6b7280">Fecha</td>
            <td style="padding:8px 0;font-weight:600">{date}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Hora</td>
            <td style="padding:8px 0;font-weight:600">{start_time}</td></tr>
      </table>
      {prm_line}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
      <p style="color:#9ca3af;font-size:12px">
        Puedes desactivar estos recordatorios en
        <a href="#" style="color:#6b7280">Ajustes → Notificaciones</a>.
      </p>
    </div>
    """
