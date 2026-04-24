-- =============================================================
-- MIGRATION 011: Superadmin role + demo mode
-- Adds:
--   - demo_mode_active column to profiles (per-user demo toggle)
--   - is_demo column to profiles (marks demo user accounts)
--   - Updates is_admin() RLS helper to include 'superadmin' role
-- =============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_mode_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- Update RLS helper: superadmin inherits all admin policies
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
