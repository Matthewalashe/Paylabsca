-- ============================================================
-- LASBCA Custom Email Verification System
-- ============================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cnxuszpzbxgpxnjtesca/sql
--
-- This replaces Supabase's broken email confirmation with our
-- own verification system using EmailJS.
-- ============================================================

-- ============================================================
-- STEP 1: Auto-confirm ALL users in Supabase Auth
-- (so signInWithPassword always works — we handle real
--  verification ourselves in the profiles table)
-- ============================================================

-- Fix all existing unconfirmed users
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
-- STEP 2: Add custom verification columns to profiles
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Mark existing seed users as already verified
UPDATE profiles SET email_verified = true, verification_token = NULL
WHERE email_verified IS NULL OR email_verified = false;

-- ============================================================
-- STEP 3: RPC function to verify email via token
-- Callable without auth (anon role) so the user can click
-- the verification link even if they're not signed in.
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_email_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_email TEXT;
BEGIN
  IF p_token IS NULL OR LENGTH(TRIM(p_token)) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid verification token.');
  END IF;

  -- Find profile with matching token
  SELECT id, email INTO v_profile_id, v_email
  FROM profiles
  WHERE verification_token = TRIM(p_token);

  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired verification link.');
  END IF;

  -- Mark as verified and clear the token (single-use)
  UPDATE profiles
  SET email_verified = true, verification_token = NULL
  WHERE id = v_profile_id;

  RETURN json_build_object('success', true, 'email', v_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to both anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;

-- ============================================================
-- STEP 4: RPC function to generate a new verification token
-- (for "resend verification" — only callable by the user)
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_verification_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Only allow users to generate tokens for themselves
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
-- DONE. Run this, then test creating a user and signing in.
-- ============================================================
