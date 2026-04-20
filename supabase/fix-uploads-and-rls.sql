-- ============================================================
-- FIX: Storage bucket visibility + RLS policy for invoice workflow
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cnxuszpzbxgpxnjtesca/sql
-- ============================================================

-- 1. Make storage buckets PUBLIC so getPublicUrl() works
UPDATE storage.buckets SET public = true WHERE id = 'invoice-photos';
UPDATE storage.buckets SET public = true WHERE id = 'cert-assets';

-- 2. Fix invoice UPDATE RLS — allow billing officers to transition
--    their own invoices through the full workflow (not just drafts)
DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer')
);

-- 3. Add storage UPDATE policy for invoice-photos (was missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_update_photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "auth_update_photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'invoice-photos');
  END IF;
END $$;

-- 4. Add storage UPDATE policy for cert-assets (was missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'auth_update_cert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "auth_update_cert" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cert-assets');
  END IF;
END $$;

-- 5. Add public read access for both buckets (anonymous users can view via public URL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_read_photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "public_read_photos" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'invoice-photos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_read_cert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "public_read_cert" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'cert-assets');
  END IF;
END $$;

-- ============================================================
-- DONE. Buckets are now public, RLS allows full workflow.
-- ============================================================
