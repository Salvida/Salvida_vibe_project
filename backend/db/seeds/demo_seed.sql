-- =============================================================
-- DEMO SEED DATA
-- Run once against the Supabase DB to populate demo records.
--
-- Prerequisites:
--   1. Create Supabase Auth users for demo personas via the
--      Supabase dashboard or CLI, then paste their UUIDs below.
--   2. Run migration 011 first.
--
-- All records use is_demo = TRUE so they are isolated from
-- production data. They only appear when demo_mode_active = TRUE
-- on the superadmin's profile.
-- =============================================================

-- ---------------------------------------------------------------
-- Replace these UUIDs with the actual Supabase auth.users IDs
-- you create for the demo personas.
-- ---------------------------------------------------------------
DO $$
DECLARE
  demo_user_1 UUID := '00000000-0000-0000-0000-000000000001'; -- demo-user-1@salvida.app
  demo_user_2 UUID := '00000000-0000-0000-0000-000000000002'; -- demo-user-2@salvida.app
  demo_user_3 UUID := '00000000-0000-0000-0000-000000000003'; -- demo-user-3@salvida.app

  prm_1 UUID;
  prm_2 UUID;
  prm_3 UUID;
  prm_4 UUID;
  prm_5 UUID;
BEGIN

-- ---------------------------------------------------------------
-- Demo profiles (must already exist in auth.users)
-- ---------------------------------------------------------------
INSERT INTO profiles (id, first_name, last_name, email, phone, organization, role, is_demo, is_active)
VALUES
  (demo_user_1, 'María', 'González', 'demo-user-1@salvida.app', '+54 11 2233 4455', 'Hospital Demo', 'user', TRUE, TRUE),
  (demo_user_2, 'Carlos', 'Rodríguez', 'demo-user-2@salvida.app', '+54 11 5566 7788', 'Clínica Demo', 'user', TRUE, TRUE),
  (demo_user_3, 'Ana', 'Martínez', 'demo-user-3@salvida.app', '+54 11 9900 1122', 'Centro Demo', 'user', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name  = EXCLUDED.last_name,
  is_demo    = TRUE;

-- ---------------------------------------------------------------
-- Demo PRMs
-- ---------------------------------------------------------------
INSERT INTO prms (id, name, email, phone, birth_date, blood_type, status, is_demo, user_id, created_by)
VALUES
  (gen_random_uuid(), 'Roberto Silva', 'roberto.silva@demo.com', '+54 11 1111 2222', '1952-03-15', 'A+', 'Activo', TRUE, demo_user_1, demo_user_1),
  (gen_random_uuid(), 'Elena Pérez', 'elena.perez@demo.com', '+54 11 3333 4444', '1945-07-22', 'O-', 'Activo', TRUE, demo_user_1, demo_user_1),
  (gen_random_uuid(), 'Miguel Torres', 'miguel.torres@demo.com', '+54 11 5555 6666', '1960-11-08', 'B+', 'Activo', TRUE, demo_user_2, demo_user_2),
  (gen_random_uuid(), 'Carmen López', 'carmen.lopez@demo.com', '+54 11 7777 8888', '1958-01-30', 'AB+', 'Inactivo', TRUE, demo_user_2, demo_user_2),
  (gen_random_uuid(), 'Jorge Fernández', 'jorge.fernandez@demo.com', '+54 11 9999 0000', '1948-09-14', 'A-', 'Activo', TRUE, demo_user_3, demo_user_3)
RETURNING id INTO prm_1;

-- Capture the IDs we just inserted for booking creation
SELECT id INTO prm_1 FROM prms WHERE email = 'roberto.silva@demo.com' AND is_demo = TRUE LIMIT 1;
SELECT id INTO prm_2 FROM prms WHERE email = 'elena.perez@demo.com' AND is_demo = TRUE LIMIT 1;
SELECT id INTO prm_3 FROM prms WHERE email = 'miguel.torres@demo.com' AND is_demo = TRUE LIMIT 1;
SELECT id INTO prm_4 FROM prms WHERE email = 'carmen.lopez@demo.com' AND is_demo = TRUE LIMIT 1;
SELECT id INTO prm_5 FROM prms WHERE email = 'jorge.fernandez@demo.com' AND is_demo = TRUE LIMIT 1;

-- ---------------------------------------------------------------
-- Demo addresses
-- ---------------------------------------------------------------
INSERT INTO addresses (full_address, lat, lng, is_accessible, alias, prm_id, user_id, validation_status)
VALUES
  ('Av. Corrientes 1234, CABA', -34.6037, -58.3816, TRUE, 'Casa', prm_1, demo_user_1, 'validated'),
  ('Calle Florida 456, CABA', -34.5997, -58.3749, FALSE, 'Trabajo', prm_2, demo_user_1, 'validated'),
  ('Av. Santa Fe 789, CABA', -34.5949, -58.3929, TRUE, 'Casa', prm_3, demo_user_2, 'validated');

-- ---------------------------------------------------------------
-- Demo bookings
-- ---------------------------------------------------------------
INSERT INTO bookings (prm_id, start_time, end_time, date, address, status, service_reason, is_demo, user_id, created_by)
VALUES
  (prm_1, '09:00', '10:00', CURRENT_DATE + 1, 'Av. Corrientes 1234, CABA', 'Approved', 'medical_appointment', TRUE, demo_user_1, demo_user_1),
  (prm_1, '14:00', '15:30', CURRENT_DATE + 3, 'Av. Corrientes 1234, CABA', 'Pending', 'physiotherapy', TRUE, demo_user_1, demo_user_1),
  (prm_2, '10:00', '11:00', CURRENT_DATE + 2, 'Calle Florida 456, CABA', 'Approved', 'dialysis', TRUE, demo_user_1, demo_user_1),
  (prm_3, '08:30', '09:30', CURRENT_DATE - 1, 'Av. Santa Fe 789, CABA', 'Completed', 'medical_appointment', TRUE, demo_user_2, demo_user_2),
  (prm_3, '16:00', '17:00', CURRENT_DATE + 5, 'Av. Santa Fe 789, CABA', 'Pending', 'administrative', TRUE, demo_user_2, demo_user_2),
  (prm_4, '11:00', '12:00', CURRENT_DATE - 3, 'Av. Rivadavia 2345, CABA', 'Cancelled', 'other', TRUE, demo_user_2, demo_user_2),
  (prm_5, '09:30', '10:30', CURRENT_DATE + 7, 'Av. Callao 678, CABA', 'Approved', 'hospital_admission', TRUE, demo_user_3, demo_user_3);

END $$;
