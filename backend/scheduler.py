"""
Background scheduler for timed notifications.

One job runs every 30 minutes:

  reminders  — finds bookings starting in ~2 hours on the same day and sends
               a reminder to the user who created the booking:
               - push notification if notification_prefs.push AND booking_reminder are true
               - email if notification_prefs.email AND booking_reminder are true

The job uses a ±30-minute window and marks each booking with sent flags
(email_reminder_sent / push_reminder_sent) so reminders are never duplicated.

Times are compared in UTC. Bookings store date (DATE) + start_time (TEXT "HH:MM").
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from db.supabase_client import get_supabase
from services.notifications import (
    booking_reminder_email_html,
    send_email_sync,
    send_push_to_user,
)

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="UTC")

_WINDOW_MINUTES = 30  # half-window around the target time


def _time_window(target: datetime) -> tuple[str, str]:
    """Return (HH:MM_from, HH:MM_to) for a ±_WINDOW_MINUTES window around *target*."""
    lo = (target - timedelta(minutes=_WINDOW_MINUTES)).strftime("%H:%M")
    hi = (target + timedelta(minutes=_WINDOW_MINUTES)).strftime("%H:%M")
    return lo, hi


# ---------------------------------------------------------------------------
# Job: 2-hour reminders (push + email)
# ---------------------------------------------------------------------------

def _send_2h_reminders() -> None:
    supabase = get_supabase()
    target = datetime.now(timezone.utc) + timedelta(hours=2)
    target_date = target.strftime("%Y-%m-%d")
    time_from, time_to = _time_window(target)

    # Fetch bookings where either push or email reminder hasn't been sent yet
    result = (
        supabase.table("bookings")
        .select(
            "id, date, start_time, created_by, prms(name), "
            "profiles!created_by(id, email, notification_prefs)"
        )
        .eq("date", target_date)
        .gte("start_time", time_from)
        .lte("start_time", time_to)
        .neq("status", "Cancelled")
        .execute()
    )

    for booking in result.data or []:
        profile = booking.get("profiles") or {}
        prefs = profile.get("notification_prefs") or {}
        booking_reminder_on = prefs.get("booking_reminder", True)

        if not booking_reminder_on:
            continue

        user_id = booking.get("created_by")
        prm_name = (booking.get("prms") or {}).get("name", "")

        # --- Push reminder ---
        push_enabled = prefs.get("push", True)
        if push_enabled and not booking.get("push_reminder_sent", False):
            body = (
                f"Tu reserva{' para ' + prm_name if prm_name else ''} "
                f"comienza a las {booking['start_time']}."
            )
            try:
                send_push_to_user(
                    user_id=user_id,
                    title="Recordatorio de reserva",
                    body=body,
                )
                supabase.table("bookings").update({"push_reminder_sent": True}).eq("id", booking["id"]).execute()
                logger.info("Push reminder sent → user %s for booking %s", user_id, booking["id"])
            except Exception as exc:
                logger.error("Failed to send push reminder for booking %s: %s", booking["id"], exc)

        # --- Email reminder ---
        email_enabled = prefs.get("email", False)
        email_address = profile.get("email", "")
        if email_enabled and email_address and not booking.get("email_reminder_sent", False):
            html = booking_reminder_email_html(booking["date"], booking["start_time"], prm_name)
            try:
                send_email_sync(
                    to=email_address,
                    subject=f"Recordatorio: reserva el {booking['date']} a las {booking['start_time']}",
                    html=html,
                )
                supabase.table("bookings").update({"email_reminder_sent": True}).eq("id", booking["id"]).execute()
                logger.info("Email reminder sent → %s for booking %s", email_address, booking["id"])
            except Exception as exc:
                logger.error("Failed to send email reminder for booking %s: %s", booking["id"], exc)


# ---------------------------------------------------------------------------
# Start / stop
# ---------------------------------------------------------------------------

def start_scheduler() -> None:
    scheduler.add_job(
        _send_2h_reminders,
        trigger="interval",
        minutes=_WINDOW_MINUTES,
        id="reminders",
        replace_existing=True,
        misfire_grace_time=60,
    )
    scheduler.start()
    logger.info("Notification scheduler started (interval=%dmin)", _WINDOW_MINUTES)


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Notification scheduler stopped")
