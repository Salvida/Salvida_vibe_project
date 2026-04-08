from fastapi import APIRouter
from db.supabase_client import get_supabase

router = APIRouter()


@router.get("")
def get_global_kpis():
    """
    Public endpoint – no authentication required.
    Returns aggregated KPIs shown on the landing page.
    """
    supabase = get_supabase()

    # Total services = all bookings ever recorded
    services_resp = supabase.table("bookings").select("id", count="exact").execute()
    total_services: int = services_resp.count or 0

    # Total users = active profiles in the system
    users_resp = (
        supabase.table("profiles")
        .select("id", count="exact")
        .eq("is_active", True)
        .execute()
    )
    total_users: int = users_resp.count or 0

    # Assistance points = validated addresses
    points_resp = (
        supabase.table("addresses")
        .select("id", count="exact")
        .eq("validation_status", "validated")
        .execute()
    )
    assistance_points: int = points_resp.count or 0

    return {
        "totalServices": total_services,
        "totalUsers": total_users,
        "assistancePoints": assistance_points,
    }
