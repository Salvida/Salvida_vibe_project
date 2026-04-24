-- =============================================================
-- MIGRATION 013: Fix is_admin() to include superadmin + Storage RLS
--
-- Problems fixed:
--   1. is_admin() only checked role = 'admin', excluding superadmin.
--      Superadmins could not upload avatars for other users via the
--      Supabase client (which doesn't bypass RLS like the service role).
--   2. The 'avatars' bucket had no RLS policies, so any cross-user
--      upload from the client returned a 403.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Fix is_admin() to include superadmin
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;

-- ---------------------------------------------------------------
-- 2. Storage RLS policies for the 'avatars' bucket
--
-- Path formats used by the frontend:
--   - User avatar:  {userId}.{ext}
--   - PRM avatar:   prm-{prmId}.{ext}
-- ---------------------------------------------------------------

-- Public read (avatars are publicly accessible via getPublicUrl)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar (path starts with their uid)
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- Admins and superadmins can upload any avatar
DROP POLICY IF EXISTS "avatars_insert_admin" ON storage.objects;
CREATE POLICY "avatars_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.is_admin()
  );

-- Users can update (upsert) their own avatar
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- Admins and superadmins can update any avatar
DROP POLICY IF EXISTS "avatars_update_admin" ON storage.objects;
CREATE POLICY "avatars_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND public.is_admin()
  );

-- Users can delete their own avatar
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- Admins and superadmins can delete any avatar
DROP POLICY IF EXISTS "avatars_delete_admin" ON storage.objects;
CREATE POLICY "avatars_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND public.is_admin()
  );
