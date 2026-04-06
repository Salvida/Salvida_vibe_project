-- =============================================================
-- MIGRATION 006: Role-Based Row Level Security
-- Replaces the permissive "all authenticated" policies with
-- owner-scoped policies that also allow admin users through.
--
-- NOTE: The backend uses the Supabase SERVICE ROLE key, which
-- bypasses RLS. These policies are a second line of defense
-- for direct Supabase client calls. Backend enforcement lives
-- in the routers.
-- =============================================================

-- ---------------------------------------------------------------
-- Helper function: returns TRUE if the calling user is an admin.
-- SECURITY DEFINER lets it read profiles without triggering a
-- recursive RLS check on the profiles table itself.
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
      AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------
-- profiles
-- Keep existing own-row policies; add admin read/write policies.
-- Multiple SELECT policies are OR-combined by Postgres.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_admin_select_all" ON profiles;
CREATE POLICY "profiles_admin_select_all"
  ON profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update_any" ON profiles;
CREATE POLICY "profiles_admin_update_any"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- ---------------------------------------------------------------
-- prms
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "prms_all_authenticated" ON prms;

CREATE POLICY "prms_select_own_or_admin"
  ON prms FOR SELECT
  USING (
    auth.uid() = created_by
    OR public.is_admin()
  );

CREATE POLICY "prms_insert_authenticated"
  ON prms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "prms_update_own_or_admin"
  ON prms FOR UPDATE
  USING (
    auth.uid() = created_by
    OR public.is_admin()
  );

CREATE POLICY "prms_delete_own_or_admin"
  ON prms FOR DELETE
  USING (
    auth.uid() = created_by
    OR public.is_admin()
  );

-- ---------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "bookings_all_authenticated" ON bookings;

CREATE POLICY "bookings_select_own_or_admin"
  ON bookings FOR SELECT
  USING (
    auth.uid() = created_by
    OR public.is_admin()
  );

CREATE POLICY "bookings_insert_authenticated"
  ON bookings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "bookings_update_own_or_admin"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = created_by
    OR public.is_admin()
  );

CREATE POLICY "bookings_delete_own_or_admin"
  ON bookings FOR DELETE
  USING (
    auth.uid() = created_by
    OR public.is_admin()
  );

-- ---------------------------------------------------------------
-- addresses
-- Some inserts set user_id but not created_by, so check both.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "addresses_all_authenticated" ON addresses;

CREATE POLICY "addresses_select_own_or_admin"
  ON addresses FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

CREATE POLICY "addresses_insert_authenticated"
  ON addresses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "addresses_update_own_or_admin"
  ON addresses FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

CREATE POLICY "addresses_delete_own_or_admin"
  ON addresses FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- ---------------------------------------------------------------
-- emergency_contacts
-- No direct owner column — inherit access via parent PRM.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "emergency_contacts_all_authenticated" ON emergency_contacts;

CREATE POLICY "emergency_contacts_select_via_prm"
  ON emergency_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prms
      WHERE prms.id = emergency_contacts.prm_id
        AND (prms.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "emergency_contacts_insert_via_prm"
  ON emergency_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prms
      WHERE prms.id = emergency_contacts.prm_id
        AND (prms.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "emergency_contacts_update_via_prm"
  ON emergency_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prms
      WHERE prms.id = emergency_contacts.prm_id
        AND (prms.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "emergency_contacts_delete_via_prm"
  ON emergency_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM prms
      WHERE prms.id = emergency_contacts.prm_id
        AND (prms.created_by = auth.uid() OR public.is_admin())
    )
  );
