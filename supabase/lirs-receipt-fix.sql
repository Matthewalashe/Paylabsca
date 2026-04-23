-- RUN THIS IN SUPABASE SQL EDITOR RIGHT NOW
-- Adds the receipt_data column and fixes payment permissions

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_data JSONB;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lirs_payer_id TEXT;

DROP POLICY IF EXISTS "invoices_update_anon" ON invoices;
CREATE POLICY "invoices_update_anon" ON invoices FOR UPDATE TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
