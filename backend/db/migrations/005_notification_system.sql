-- =============================================================
-- MIGRATION 005: Notification System
-- Run in Supabase SQL Editor
-- =============================================================

-- -------------------------------------------------------
-- TABLE: push_subscriptions
-- Stores Web Push API subscription objects per user.
-- One user can have multiple device subscriptions.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- -------------------------------------------------------
-- COLUMNS: reminder sent flags on bookings
-- Prevent duplicate email/push reminders for the same booking.
-- -------------------------------------------------------
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS email_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS push_reminder_sent  BOOLEAN NOT NULL DEFAULT FALSE;

-- -------------------------------------------------------
-- RLS: push_subscriptions
-- Users can only read/write their own subscriptions.
-- -------------------------------------------------------
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subscriptions_user_select ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_subscriptions_user_insert ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subscriptions_user_delete ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
