-- ============================================================
-- LASBCA MASTER FIX — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/cnxuszpzbxgpxnjtesca/sql
-- ============================================================
-- Fixes: sign-in, user creation, suspend, delete, role changes
-- ============================================================

-- ============================================================
-- 1. FIX SIGN-IN: Auto-confirm all Supabase Auth users
-- ============================================================

-- Confirm all existing unconfirmed users RIGHT NOW
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Trigger: auto-confirm every future user on creation
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_confirm_new_user ON auth.users;
CREATE TRIGGER auto_confirm_new_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- ============================================================
-- 2. ADD EMAIL VERIFICATION COLUMNS
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Mark existing seed/admin users as already verified
UPDATE profiles SET email_verified = true, verification_token = NULL;

-- ============================================================
-- 3. FIX RLS: Let cert officers manage ALL users
-- ============================================================

-- Drop the broken update policy (only allows self-update)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- NEW: Users can update own profile, cert officers can update ANY profile
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer')
  );

-- NEW: Cert officers can delete any profile (except their own is blocked in code)
DROP POLICY IF EXISTS "profiles_delete_cert" ON profiles;
CREATE POLICY "profiles_delete_cert" ON profiles FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer')
  );

-- ============================================================
-- 4. EMAIL VERIFICATION RPC FUNCTIONS
-- ============================================================

-- Verify email via token (callable without auth)
CREATE OR REPLACE FUNCTION public.verify_email_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_email TEXT;
BEGIN
  IF p_token IS NULL OR LENGTH(TRIM(p_token)) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid verification token.');
  END IF;

  SELECT id, email INTO v_profile_id, v_email
  FROM profiles
  WHERE verification_token = TRIM(p_token);

  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired verification link.');
  END IF;

  UPDATE profiles
  SET email_verified = true, verification_token = NULL
  WHERE id = v_profile_id;

  RETURN json_build_object('success', true, 'email', v_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;

-- Generate new verification token (for resend - authenticated only)
CREATE OR REPLACE FUNCTION public.generate_verification_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_token := gen_random_uuid()::TEXT;

  UPDATE profiles
  SET verification_token = v_token, email_verified = false
  WHERE id = p_user_id;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_verification_token(UUID) TO authenticated;

-- ============================================================
-- DONE. All fixes applied.
-- ============================================================
