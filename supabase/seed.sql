-- ============================================================
-- SEED DATA — Run AFTER migration.sql
-- ============================================================
-- This creates the default users in Supabase Auth + profiles.
-- Run in SQL Editor: https://supabase.com/dashboard/project/cnxuszpzbxgpxnjtesca/sql
-- ============================================================

-- IMPORTANT: Before running this, go to:
-- Authentication > Providers > Email
-- And disable "Confirm email" so users can log in immediately.

-- Create auth users (email + password)
-- Note: Supabase uses bcrypt internally, we use the raw API

-- 1. Certification Officer
SELECT auth.uid(); -- just to verify auth schema exists

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'b.mustapha@lasbca.lg.gov.ng',
  crypt('Certify@2026', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Arc. Bolatito Mustapha"}',
  'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'b.mustapha@lasbca.lg.gov.ng',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"b.mustapha@lasbca.lg.gov.ng"}',
  'email', now(), now(), now()
) ON CONFLICT (id, provider) DO NOTHING;

-- 2. Billing Officer
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'a.ogunlade@lasbca.lg.gov.ng',
  crypt('Billing@2026', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Adeyemi Ogunlade"}',
  'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a.ogunlade@lasbca.lg.gov.ng',
  'b0000000-0000-0000-0000-000000000001',
  '{"sub":"b0000000-0000-0000-0000-000000000001","email":"a.ogunlade@lasbca.lg.gov.ng"}',
  'email', now(), now(), now()
) ON CONFLICT (id, provider) DO NOTHING;

-- 3. Billing Officer #2
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'f.adebayo@lasbca.lg.gov.ng',
  crypt('Billing@2026', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Funke Adebayo"}',
  'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'f.adebayo@lasbca.lg.gov.ng',
  'b0000000-0000-0000-0000-000000000002',
  '{"sub":"b0000000-0000-0000-0000-000000000002","email":"f.adebayo@lasbca.lg.gov.ng"}',
  'email', now(), now(), now()
) ON CONFLICT (id, provider) DO NOTHING;

-- ============================================================
-- PROFILE ROWS (linked to auth users above)
-- ============================================================

INSERT INTO profiles (id, name, email, phone, oracle_number, role, department, avatar, status)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Arc. Bolatito Mustapha', 'b.mustapha@lasbca.lg.gov.ng', '+2348098765432', 'ORC-2024-0100', 'certification_officer', 'Building Certification Department', 'BM', 'active'),
  ('b0000000-0000-0000-0000-000000000001', 'Adeyemi Ogunlade', 'a.ogunlade@lasbca.lg.gov.ng', '+2348012345678', 'ORC-2024-0451', 'billing_officer', 'Building Certification Department', 'AO', 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'Funke Adebayo', 'f.adebayo@lasbca.lg.gov.ng', '+2348055512345', 'ORC-2024-0452', 'billing_officer', 'Building Certification Department', 'FA', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE. Default users created. They can now sign in.
-- ============================================================
