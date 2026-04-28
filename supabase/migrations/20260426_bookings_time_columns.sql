-- Migrate start_time and end_time from TEXT to TIME
-- Existing values are already in HH:MM format, cast is safe
ALTER TABLE bookings
  ALTER COLUMN start_time TYPE TIME USING start_time::TIME,
  ALTER COLUMN end_time   TYPE TIME USING end_time::TIME;
