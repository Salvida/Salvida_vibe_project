-- =============================================================
-- 009 – Global KPIs view for the public landing page
-- Used by GET /globalKpis (no auth required, served via FastAPI
-- with the service-role key so RLS is bypassed at the API layer)
-- =============================================================

-- Convenience view (optional – FastAPI queries tables directly,
-- but this view is useful for direct DB inspection / dashboards)
CREATE OR REPLACE VIEW public.global_kpis AS
SELECT
  (SELECT COUNT(*)::int FROM public.bookings)                             AS total_services,
  (SELECT COUNT(*)::int FROM public.profiles  WHERE is_active = true)    AS total_users,
  (SELECT COUNT(*)::int FROM public.addresses WHERE validation_status = 'validated') AS assistance_points;

-- The view is only queried by the backend service-role key,
-- so no additional grants to the anon/authenticated roles are needed.
-- If you ever want to query it directly from the Supabase client
-- (e.g. edge functions), run:
--   GRANT SELECT ON public.global_kpis TO anon;
