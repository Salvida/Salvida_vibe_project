-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER 001_initial_schema.sql
-- =============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE prms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;

-- ---- profiles ------------------------------------------------
-- Users can only read and update their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---- addresses -----------------------------------------------
-- Any authenticated user can read, create, update addresses
CREATE POLICY "addresses_all_authenticated"
  ON addresses FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---- prms ----------------------------------------------------
CREATE POLICY "prms_all_authenticated"
  ON prms FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---- emergency_contacts --------------------------------------
CREATE POLICY "emergency_contacts_all_authenticated"
  ON emergency_contacts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---- bookings ------------------------------------------------
CREATE POLICY "bookings_all_authenticated"
  ON bookings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
