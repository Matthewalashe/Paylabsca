-- ============================================================
-- FIX: Allow anonymous (non-logged-in) users to read invoice
-- data on the public payment page.
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing policies first (safe if they don't exist)
DROP POLICY IF EXISTS "invoices_select_anon" ON invoices;
DROP POLICY IF EXISTS "photos_select_anon" ON invoice_photos;
DROP POLICY IF EXISTS "assets_select_anon" ON cert_assets;
DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;

-- 1. Allow anonymous users to read invoices (payment page loads invoice)
CREATE POLICY "invoices_select_anon" ON invoices FOR SELECT TO anon USING (true);

-- 2. Allow anonymous users to read photo metadata (to get storage paths)
CREATE POLICY "photos_select_anon" ON invoice_photos FOR SELECT TO anon USING (true);

-- 3. Allow anonymous users to read cert assets (stamps/signatures on invoices)
CREATE POLICY "assets_select_anon" ON cert_assets FOR SELECT TO anon USING (true);

-- 4. Allow anonymous users to read profiles (to show billing officer name)
CREATE POLICY "profiles_select_anon" ON profiles FOR SELECT TO anon USING (true);

-- ============================================================
-- DONE. Payment page will now work for non-logged-in clients.
-- ============================================================
