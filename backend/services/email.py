"""
Email service using Resend.
All functions are fire-and-forget: they log errors but never raise,
so a failed email never breaks the caller.
"""
import logging
from config import get_settings

logger = logging.getLogger(__name__)


def _get_resend():
    import resend
    settings = get_settings()
    if not settings.resend_api_key:
        return None
    resend.api_key = settings.resend_api_key
    return resend


def send_review_request(
    *,
    to_email: str,
    user_name: str,
    booking_date: str,
) -> None:
    """
    Send a post-service email asking the user to leave a review on
    Google and/or Facebook.
    """
    resend = _get_resend()
    if resend is None:
        logger.warning("Resend API key not configured – review request email skipped.")
        return

    settings = get_settings()
    google_review_url = (
        f"https://search.google.com/local/writereview?placeid={settings.google_place_id}"
        if settings.google_place_id
        else "https://www.google.com/search?q=Salvida"
    )
    facebook_review_url = settings.facebook_review_url

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
      <h2 style="color:#6a1b9a">¡Gracias por confiar en Salvida, {user_name}!</h2>
      <p>
        Esperamos que tu servicio del <strong>{booking_date}</strong> haya sido
        de tu satisfacción. Tu opinión es muy importante para nosotros y para
        otras personas que necesitan nuestro apoyo.
      </p>
      <p>¿Podrías dedicarnos un minuto para dejar tu valoración?</p>

      <div style="margin:2rem 0;display:flex;gap:1rem;flex-wrap:wrap">
        <a href="{google_review_url}"
           style="background:#4285F4;color:#fff;padding:0.75rem 1.5rem;border-radius:8px;
                  text-decoration:none;font-weight:bold;display:inline-block">
          ⭐ Valorar en Google
        </a>
        <a href="{facebook_review_url}"
           style="background:#1877F2;color:#fff;padding:0.75rem 1.5rem;border-radius:8px;
                  text-decoration:none;font-weight:bold;display:inline-block;margin-top:0.5rem">
          👍 Recomendar en Facebook
        </a>
      </div>

      <p style="font-size:0.85rem;color:#888">
        Si tienes algún comentario o incidencia, no dudes en contactarnos en
        <a href="mailto:hola@salvida.es" style="color:#6a1b9a">hola@salvida.es</a>.
      </p>
      <p style="font-size:0.85rem;color:#aaa">Salvida – Movilidad con dignidad</p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": [to_email],
            "subject": "¿Cómo fue tu experiencia con Salvida? ⭐",
            "html": html,
        })
        logger.info("Review request email sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send review request email to %s: %s", to_email, exc)
