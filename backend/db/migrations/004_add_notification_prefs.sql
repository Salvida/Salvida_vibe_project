-- Add notification preferences column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{"email": true, "push": true, "booking_reminder": true}'::JSONB;
