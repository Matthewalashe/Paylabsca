-- ============================================================
-- LASBCA TARGETED FIX — Run each block separately if needed
-- https://supabase.com/dashboard/project/cnxuszpzbxgpxnjtesca/sql
-- ============================================================

-- ==========================================
-- BLOCK 1: Fix ALL unconfirmed auth users
-- (This fixes the sarawoods033 sign-in issue)
-- ==========================================
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ==========================================
-- BLOCK 2: Add verification columns
-- ==========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Mark all existing users as verified
UPDATE profiles SET email_verified = true WHERE email_verified = false OR email_verified IS NULL;

-- ==========================================
-- BLOCK 3: FIX RLS — Let cert officers
-- manage other users (suspend/delete/role)
-- ==========================================
-- Drop old restrictive policy (only allows self-update)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Cert officers can update ANY profile, users can update their own
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer')
  );

-- Cert officers can delete profiles
DROP POLICY IF EXISTS "profiles_delete_cert" ON profiles;
CREATE POLICY "profiles_delete_cert" ON profiles FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer')
  );

-- ==========================================
-- BLOCK 4: Verify email RPC (public access)
-- ==========================================
CREATE OR REPLACE FUNCTION public.verify_email_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_email TEXT;
BEGIN
  IF p_token IS NULL OR LENGTH(TRIM(p_token)) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token.');
  END IF;
  SELECT id, email INTO v_profile_id, v_email FROM profiles WHERE verification_token = TRIM(p_token);
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired link.');
  END IF;
  UPDATE profiles SET email_verified = true, verification_token = NULL WHERE id = v_profile_id;
  RETURN json_build_object('success', true, 'email', v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;

-- ==========================================
-- BLOCK 5: Generate verification token RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.generate_verification_token(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_token := gen_random_uuid()::TEXT;
  UPDATE profiles SET verification_token = v_token, email_verified = false WHERE id = p_user_id;
  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_verification_token(UUID) TO authenticated;
