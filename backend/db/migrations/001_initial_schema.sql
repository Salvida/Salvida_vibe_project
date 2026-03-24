-- =============================================================
-- EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUM TYPES
-- =============================================================
CREATE TYPE patient_status AS ENUM ('Activo', 'Inactivo');
CREATE TYPE address_validation_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE booking_status AS ENUM ('Approved', 'Pending', 'Completed', 'Cancelled');
CREATE TYPE service_reason AS ENUM (
  'medical_appointment',
  'physiotherapy',
  'dialysis',
  'hospital_admission',
  'administrative',
  'other'
);
CREATE TYPE booking_urgency AS ENUM ('routine', 'urgent');

-- =============================================================
-- TABLE: profiles
-- One row per authenticated Supabase Auth user.
-- Auto-created via trigger on_auth_user_created (below).
-- =============================================================
CREATE TABLE profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name   TEXT        NOT NULL DEFAULT '',
  last_name    TEXT        NOT NULL DEFAULT '',
  email        TEXT        NOT NULL DEFAULT '',
  phone        TEXT        NOT NULL DEFAULT '',
  organization TEXT        NOT NULL DEFAULT '',
  dni          TEXT,
  role         TEXT        NOT NULL DEFAULT 'staff',
  avatar       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: addresses
-- Standalone reusable addresses linked to patients.
-- =============================================================
CREATE TABLE addresses (
  id                UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_address      TEXT                      NOT NULL,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  validation_status address_validation_status NOT NULL DEFAULT 'pending',
  validation_notes  TEXT,
  is_accessible     BOOLEAN                   NOT NULL DEFAULT FALSE,
  created_by        UUID                      REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: patients (PRMs)
-- NOTE: id is TEXT (not UUID) to support legacy IDs like
--       '12345', 'SLV-8821'. New records default to uuid::text.
-- =============================================================
CREATE TABLE patients (
  id          TEXT           PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  name        TEXT           NOT NULL,
  email       TEXT           NOT NULL DEFAULT '',
  phone       TEXT           NOT NULL DEFAULT '',
  birth_date  DATE,
  blood_type  TEXT           NOT NULL DEFAULT '',
  height      TEXT           NOT NULL DEFAULT '',
  weight      TEXT           NOT NULL DEFAULT '',
  status      patient_status NOT NULL DEFAULT 'Activo',
  avatar      TEXT,
  dni         TEXT,
  address_id  UUID           REFERENCES addresses(id) ON DELETE SET NULL,
  is_demo     BOOLEAN        NOT NULL DEFAULT FALSE,
  created_by  UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: emergency_contacts
-- =============================================================
CREATE TABLE emergency_contacts (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id   TEXT        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  relationship TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: bookings
-- =============================================================
CREATE TABLE bookings (
  id                   UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id           TEXT            NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  start_time           TEXT            NOT NULL DEFAULT '',
  end_time             TEXT            NOT NULL DEFAULT '',
  date                 DATE            NOT NULL,
  location             TEXT            NOT NULL DEFAULT '',
  status               booking_status  NOT NULL DEFAULT 'Pending',
  service_reason       service_reason,
  service_reason_notes TEXT,
  urgency              booking_urgency NOT NULL DEFAULT 'routine',
  is_demo              BOOLEAN         NOT NULL DEFAULT FALSE,
  created_by           UUID            REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_patients_status      ON patients(status);
CREATE INDEX idx_patients_created_by  ON patients(created_by);
CREATE INDEX idx_bookings_patient_id  ON bookings(patient_id);
CREATE INDEX idx_bookings_date        ON bookings(date);
CREATE INDEX idx_bookings_status      ON bookings(status);
CREATE INDEX idx_bookings_created_by  ON bookings(created_by);
CREATE INDEX idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_addresses
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_patients
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- AUTO-CREATE PROFILE ON SUPABASE AUTH SIGNUP
-- =============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
