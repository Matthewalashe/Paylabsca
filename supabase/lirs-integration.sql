-- ============================================================
-- LIRS Integration + Payment Fix — Run this in Supabase SQL Editor
-- ============================================================
-- This single script:
-- 1. Creates LIRS payer ID and revenue receipt tables
-- 2. Adds columns to invoices for LIRS tracking
-- 3. Sets up all necessary RLS policies (including anon payment)
-- 4. Fixes the payment flow for public (unauthenticated) users
-- ============================================================

-- ── 1. LIRS Payer IDs ──
CREATE TABLE IF NOT EXISTS lirs_payer_ids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payer_type TEXT NOT NULL CHECK (payer_type IN ('individual', 'corporate')),
  payer_id TEXT NOT NULL UNIQUE,
  payer_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  bvn_hash TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. LIRS Revenue Receipts ──
CREATE TABLE IF NOT EXISTS lirs_revenue_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  payer_id_ref UUID REFERENCES lirs_payer_ids(id),
  receipt_number TEXT NOT NULL UNIQUE,
  assessment_reference TEXT NOT NULL,
  revenue_code TEXT NOT NULL,
  agency_code TEXT NOT NULL,
  payer_id_display TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'Web Payment',
  payment_bank TEXT DEFAULT 'LIRS Approved Gateway',
  transaction_ref TEXT,
  teller_id TEXT,
  entry_id TEXT NOT NULL,
  security_code TEXT NOT NULL,
  is_test BOOLEAN DEFAULT true,
  receipt_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Add LIRS columns to invoices ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'lirs_receipt_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN lirs_receipt_id UUID REFERENCES lirs_revenue_receipts(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'lirs_payer_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN lirs_payer_id TEXT;
  END IF;
END $$;

-- ── 4. Indexes ──
CREATE INDEX IF NOT EXISTS idx_lirs_payer_ids_payer_id ON lirs_payer_ids(payer_id);
CREATE INDEX IF NOT EXISTS idx_lirs_payer_ids_name ON lirs_payer_ids(payer_name);
CREATE INDEX IF NOT EXISTS idx_lirs_payer_ids_phone ON lirs_payer_ids(client_phone);
CREATE INDEX IF NOT EXISTS idx_lirs_receipts_invoice ON lirs_revenue_receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_lirs_receipts_number ON lirs_revenue_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_lirs_receipts_entry ON lirs_revenue_receipts(entry_id);

-- ── 5. Enable RLS ──
ALTER TABLE lirs_payer_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE lirs_revenue_receipts ENABLE ROW LEVEL SECURITY;

-- ── 6. Drop any old policies (safe to rerun) ──
DROP POLICY IF EXISTS "payer_ids_select" ON lirs_payer_ids;
DROP POLICY IF EXISTS "payer_ids_insert" ON lirs_payer_ids;
DROP POLICY IF EXISTS "payer_ids_insert_anon" ON lirs_payer_ids;
DROP POLICY IF EXISTS "payer_ids_select_anon" ON lirs_payer_ids;
DROP POLICY IF EXISTS "receipts_select_auth" ON lirs_revenue_receipts;
DROP POLICY IF EXISTS "receipts_insert_auth" ON lirs_revenue_receipts;
DROP POLICY IF EXISTS "receipts_select_anon" ON lirs_revenue_receipts;
DROP POLICY IF EXISTS "receipts_insert_anon" ON lirs_revenue_receipts;
DROP POLICY IF EXISTS "invoices_lirs_update_anon" ON invoices;

-- ── 7. Create RLS policies ──

-- Payer IDs: full access for authenticated
CREATE POLICY "payer_ids_select" ON lirs_payer_ids
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "payer_ids_insert" ON lirs_payer_ids
  FOR INSERT TO authenticated WITH CHECK (true);

-- Payer IDs: anon can read and create (public payment page)
CREATE POLICY "payer_ids_select_anon" ON lirs_payer_ids
  FOR SELECT TO anon USING (true);
CREATE POLICY "payer_ids_insert_anon" ON lirs_payer_ids
  FOR INSERT TO anon WITH CHECK (true);

-- Revenue Receipts: full access for authenticated
CREATE POLICY "receipts_select_auth" ON lirs_revenue_receipts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "receipts_insert_auth" ON lirs_revenue_receipts
  FOR INSERT TO authenticated WITH CHECK (true);

-- Revenue Receipts: anon can read and create (public payment page)
CREATE POLICY "receipts_select_anon" ON lirs_revenue_receipts
  FOR SELECT TO anon USING (true);
CREATE POLICY "receipts_insert_anon" ON lirs_revenue_receipts
  FOR INSERT TO anon WITH CHECK (true);

-- ── 8. CRITICAL: Allow anon to update invoices (payment from public page) ──
-- Without this, the "Pay" button fails because the public payment page is unauthenticated
CREATE POLICY "invoices_lirs_update_anon" ON invoices
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ── Done ──
CREATE SEQUENCE IF NOT EXISTS lirs_payer_id_seq START WITH 1000001 INCREMENT BY 1;
