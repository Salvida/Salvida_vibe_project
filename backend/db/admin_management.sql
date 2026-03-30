-- =============================================================
-- ADMIN USER MANAGEMENT SCRIPTS
-- =============================================================
-- Use these scripts to manage admin users in your database
-- Replace 'user-id-here' with actual user UUID from auth.users

-- Grant admin access to a user
UPDATE profiles
SET role = 'admin'
WHERE id = 'user-id-here';

-- Revoke admin access from a user (revert to default role)
UPDATE profiles
SET role = 'staff'
WHERE id = 'user-id-here';

-- View all admin users
SELECT id, first_name, last_name, email, role, created_at
FROM profiles
WHERE role = 'admin';

-- View all admin users with full details
SELECT id, first_name, last_name, email, phone, organization, role, created_at, updated_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Get role for a specific user
SELECT id, email, role
FROM profiles
WHERE email = 'user@example.com';
