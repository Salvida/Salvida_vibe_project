-- =============================================================
-- MIGRATION 012: Mark existing data as demo + promote devs to superadmin
--
-- All data currently in the DB is test/dev data.
-- Real admins and real users will be added going forward.
-- New records default to is_demo = FALSE (migration 011 default).
-- =============================================================

-- Promote developer admins to superadmin
UPDATE profiles SET role = 'superadmin' WHERE role = 'admin';

-- Mark all existing user profiles as demo
UPDATE profiles SET is_demo = TRUE WHERE role = 'user';

-- Mark all existing PRMs and bookings as demo
UPDATE prms     SET is_demo = TRUE WHERE is_demo = FALSE;
UPDATE bookings SET is_demo = TRUE WHERE is_demo = FALSE;
