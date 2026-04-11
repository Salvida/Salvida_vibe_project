-- Fix notification_prefs default: email should be false for new users
ALTER TABLE profiles
ALTER COLUMN notification_prefs SET DEFAULT '{"email": false, "push": true, "booking_reminder": true}'::JSONB;
