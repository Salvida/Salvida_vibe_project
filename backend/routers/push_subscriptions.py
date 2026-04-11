from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from auth.dependencies import get_current_user
from config import get_settings
from db.supabase_client import get_supabase

router = APIRouter()


class PushSubscriptionPayload(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


# ---------------------------------------------------------------------------
# GET /api/push/vapid-key
# Returns the VAPID public key so the frontend can subscribe.
# ---------------------------------------------------------------------------
@router.get("/vapid-key")
def get_vapid_key():
    settings = get_settings()
    return {"publicKey": settings.vapid_public_key}


# ---------------------------------------------------------------------------
# POST /api/push/subscribe
# Saves (or updates) a browser push subscription for the authenticated user.
# ---------------------------------------------------------------------------
@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
def subscribe(body: PushSubscriptionPayload, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.table("push_subscriptions").upsert(
        {
            "user_id": user["sub"],
            "endpoint": body.endpoint,
            "p256dh": body.p256dh,
            "auth": body.auth,
        },
        on_conflict="endpoint",
    ).execute()
    return {"status": "subscribed"}


# ---------------------------------------------------------------------------
# POST /api/push/unsubscribe
# Removes a browser push subscription for the authenticated user.
# Using POST (not DELETE) so the request body is reliably sent by all browsers.
# ---------------------------------------------------------------------------
@router.post("/unsubscribe", status_code=status.HTTP_200_OK)
def unsubscribe(body: PushSubscriptionPayload, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.table("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", user["sub"]).execute()
    return {"status": "unsubscribed"}
