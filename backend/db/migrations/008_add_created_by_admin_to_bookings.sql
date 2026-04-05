-- =============================================================
-- MIGRATION 008: Add created_by_admin flag to bookings
-- Tracks when a booking was created by an admin on behalf
-- of a user, so it can be surfaced in the UI.
-- =============================================================

ALTER TABLE bookings
  ADD COLUMN created_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
