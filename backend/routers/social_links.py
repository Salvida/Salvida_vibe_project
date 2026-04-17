from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from db.supabase_client import get_supabase
from auth.dependencies import get_current_user
from auth.roles import require_admin

router = APIRouter()


class SocialLinkCreate(BaseModel):
    platform: str
    label: str
    url: str
    order: int = 0


class SocialLinkUpdate(BaseModel):
    platform: str | None = None
    label: str | None = None
    url: str | None = None
    order: int | None = None


class SocialLink(BaseModel):
    id: str
    platform: str
    label: str
    url: str
    order: int


@router.get("", response_model=list[SocialLink])
def get_social_links():
    """Public – returns all social links ordered for the landing page."""
    supabase = get_supabase()
    result = supabase.table("social_links").select("*").order("order").execute()
    return [
        SocialLink(
            id=row["id"],
            platform=row["platform"],
            label=row["label"],
            url=row["url"],
            order=row["order"],
        )
        for row in result.data
    ]


@router.post("", response_model=SocialLink, status_code=status.HTTP_201_CREATED)
def create_social_link(body: SocialLinkCreate, user: dict = Depends(get_current_user)):
    require_admin(user["sub"])
    supabase = get_supabase()
    result = (
        supabase.table("social_links")
        .insert({"platform": body.platform, "label": body.label, "url": body.url, "order": body.order})
        .execute()
    )
    row = result.data[0]
    return SocialLink(id=row["id"], platform=row["platform"], label=row["label"], url=row["url"], order=row["order"])


@router.put("/{link_id}", response_model=SocialLink)
def update_social_link(link_id: str, body: SocialLinkUpdate, user: dict = Depends(get_current_user)):
    require_admin(user["sub"])
    supabase = get_supabase()
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    result = supabase.table("social_links").update(patch).eq("id", link_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social link not found")
    row = result.data[0]
    return SocialLink(id=row["id"], platform=row["platform"], label=row["label"], url=row["url"], order=row["order"])


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_link(link_id: str, user: dict = Depends(get_current_user)):
    require_admin(user["sub"])
    supabase = get_supabase()
    supabase.table("social_links").delete().eq("id", link_id).execute()
