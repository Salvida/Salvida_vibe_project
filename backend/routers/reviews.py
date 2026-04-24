"""
GET  /api/reviews        – public, returns cached reviews from DB
                           (syncs from Google if DB is empty and API is configured)
POST /api/reviews/sync   – admin only, forces a fresh sync from Google
"""
from fastapi import APIRouter, BackgroundTasks, Depends, status
from pydantic import BaseModel
from typing import Optional
from db.supabase_client import get_supabase
from auth.dependencies import get_current_user
from auth.roles import require_admin
from services.google_reviews import sync_google_reviews
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class Review(BaseModel):
    id: str
    source: str
    author_name: str
    author_avatar: Optional[str] = None
    rating: int
    text: str
    published_at: Optional[str] = None


def _rows_to_reviews(rows: list[dict]) -> list[Review]:
    return [
        Review(
            id=row["id"],
            source=row["source"],
            author_name=row["author_name"],
            author_avatar=row.get("author_avatar"),
            rating=row["rating"],
            text=row["text"],
            published_at=row.get("published_at"),
        )
        for row in rows
    ]


def _trigger_sync_in_background() -> None:
    """Fire-and-forget: syncs Google reviews. Errors are logged, not raised."""
    try:
        sync_google_reviews()
    except Exception as exc:
        logger.error("Background review sync failed: %s", exc)


@router.get("", response_model=list[Review])
def get_reviews(background_tasks: BackgroundTasks):
    """
    Returns cached reviews. If the DB is empty and Google Places is configured,
    schedules a background sync so this request returns immediately.
    Falls back to empty list on any error.
    """
    supabase = get_supabase()
    try:
        result = (
            supabase.table("reviews")
            .select("*")
            .order("published_at", desc=True)
            .limit(6)
            .execute()
        )
        rows = result.data or []

        # Schedule a background sync when the table is empty so this
        # request is not blocked by the Google Places API call.
        if not rows:
            background_tasks.add_task(_trigger_sync_in_background)

        return _rows_to_reviews(rows)
    except Exception as exc:
        logger.error("Failed to fetch reviews: %s", exc)
        return []


@router.post("/sync", status_code=status.HTTP_200_OK)
def force_sync_reviews(user: dict = Depends(get_current_user)):
    """Admin only – forces a fresh sync from Google Places."""
    require_admin(user)
    count = sync_google_reviews()
    return {"synced": count}
