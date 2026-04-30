-- Make is_accessible nullable to represent tri-state:
--   NULL  = pending review (not yet assessed)
--   true  = accessible / apt for service
--   false = not accessible / not apt for service
ALTER TABLE addresses
  ALTER COLUMN is_accessible DROP NOT NULL,
  ALTER COLUMN is_accessible DROP DEFAULT;

-- Reset existing rows to NULL so they appear as "pending review"
UPDATE addresses SET is_accessible = NULL;
