-- =============================================================
-- MIGRATION 007: Add is_active soft-delete flag to profiles
-- Admins can archive users (is_active = false) without deleting
-- their data or associated PRMs/bookings.
-- =============================================================

ALTER TABLE profiles
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_profiles_is_active ON profiles(is_active);
