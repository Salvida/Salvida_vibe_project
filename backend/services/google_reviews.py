"""
Fetches reviews from the Google Places API (New) and caches them
in the public.reviews table.

Google Places API v1 endpoint:
  GET https://places.googleapis.com/v1/places/{placeId}
  Header: X-Goog-Api-Key: <key>
  Header: X-Goog-FieldMask: reviews,displayName

Each review object contains:
  name, rating, text.text, authorAttribution.displayName,
  authorAttribution.photoUri, publishTime
"""
import logging
from datetime import datetime, timezone

import httpx

from config import get_settings
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

PLACES_API_URL = "https://places.googleapis.com/v1/places/{place_id}"


def sync_google_reviews() -> int:
    """
    Fetches up to 5 Google reviews for the configured Place ID and
    upserts them into the reviews table.
    Returns the number of reviews stored, or 0 on any error.
    """
    settings = get_settings()
    if not settings.google_places_api_key or not settings.google_place_id:
        logger.debug("Google Places not configured – skipping review sync.")
        return 0

    url = PLACES_API_URL.format(place_id=settings.google_place_id)
    try:
        response = httpx.get(
            url,
            headers={
                "X-Goog-Api-Key": settings.google_places_api_key,
                "X-Goog-FieldMask": "reviews,displayName",
            },
            timeout=10,
        )
        response.raise_for_status()
    except Exception as exc:
        logger.error("Google Places API request failed: %s", exc)
        return 0

    data = response.json()
    raw_reviews = data.get("reviews") or []
    if not raw_reviews:
        logger.info("No reviews returned from Google Places API.")
        return 0

    supabase = get_supabase()
    stored = 0
    for rev in raw_reviews:
        try:
            author = rev.get("authorAttribution", {})
            text_obj = rev.get("text", {})
            rating = rev.get("rating", 5)
            published_at = rev.get("publishTime")

            row = {
                "source": "google",
                "author_name": author.get("displayName", "Anónimo"),
                "author_avatar": author.get("photoUri"),
                "rating": int(rating),
                "text": text_obj.get("text", ""),
                "published_at": published_at,
                "synced_at": datetime.now(timezone.utc).isoformat(),
            }
            supabase.table("reviews").insert(row).execute()
            stored += 1
        except Exception as exc:
            logger.error("Failed to store review: %s", exc)

    logger.info("Synced %d Google reviews.", stored)
    return stored
