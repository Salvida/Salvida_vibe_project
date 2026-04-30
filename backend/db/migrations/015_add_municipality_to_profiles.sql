ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS default_lat float8,
  ADD COLUMN IF NOT EXISTS default_lng float8;
