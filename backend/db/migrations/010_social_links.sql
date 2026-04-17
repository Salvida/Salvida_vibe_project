-- =============================================================
-- 010 – Social links table for the landing page footer/nav
-- Managed by admins via Settings > RRSS tab
-- =============================================================

CREATE TABLE IF NOT EXISTS public.social_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    text NOT NULL,           -- e.g. 'facebook', 'instagram'
  label       text NOT NULL,           -- display name
  url         text NOT NULL,           -- full profile URL
  "order"     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Only admins (via service-role key at API layer) can write.
-- Public read is handled by the backend, which bypasses RLS with the service-role key.
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (landing page is public)
CREATE POLICY "social_links_read_all"
  ON public.social_links FOR SELECT
  USING (true);

-- Only authenticated admins can insert/update/delete (enforced at API layer,
-- but this policy is a safety net for direct client queries)
CREATE POLICY "social_links_write_admin"
  ON public.social_links FOR ALL
  USING (false)
  WITH CHECK (false);

-- Default social links
INSERT INTO public.social_links (platform, label, url, "order") VALUES
  ('facebook',  'Facebook',  'https://www.facebook.com/p/Salvida-61565788268475/', 0),
  ('instagram', 'Instagram', 'https://www.instagram.com',                          1),
  ('tiktok',    'TikTok',    'https://www.tiktok.com',                             2),
  ('google',    'Google',    'https://www.google.com',                             3)
ON CONFLICT DO NOTHING;
