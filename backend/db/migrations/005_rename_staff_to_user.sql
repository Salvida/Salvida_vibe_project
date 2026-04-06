-- =============================================================
-- MIGRATION 005: Rename role 'staff' → 'user'
-- 'staff' implied an employee, but this role represents a
-- regular client/user of the application.
-- =============================================================

-- Change default for new users
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Migrate existing records
UPDATE profiles SET role = 'user' WHERE role = 'staff';
