-- Add signature columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS signed_at     TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signature_url TEXT        DEFAULT NULL;

-- Update status check constraint to allow SignPending (idempotent)
DO $$
BEGIN
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('Pending', 'Approved', 'Completed', 'Cancelled', 'SignPending'));
END $$;

-- Enforce signed_at and signature_url are set together
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_signature_pair_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_signature_pair_check
      CHECK ((signed_at IS NULL) = (signature_url IS NULL));
  END IF;
END $$;

-- Create private storage bucket for signed contracts
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-contracts', 'booking-contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role full access (backend uses service key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role full access on booking-contracts'
  ) THEN
    CREATE POLICY "Service role full access on booking-contracts"
      ON storage.objects FOR ALL
      TO service_role
      USING (bucket_id = 'booking-contracts')
      WITH CHECK (bucket_id = 'booking-contracts');
  END IF;
END $$;
