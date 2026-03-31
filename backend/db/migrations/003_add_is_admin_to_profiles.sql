-- =============================================================
-- MIGRATION: Remove is_admin column from profiles table
-- is_admin has been replaced by the existing `role` column.
-- Run this on existing databases that still have the is_admin column.
-- =============================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
