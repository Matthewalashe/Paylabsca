-- ============================================================
-- LIRS Fix: Reload PostgREST schema cache
-- ============================================================
-- Run this AFTER lirs-integration.sql to fix 406 errors.
-- PostgREST caches the schema on startup; new tables need a reload.
-- ============================================================

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the tables exist and are accessible
SELECT 'lirs_payer_ids' AS table_name, COUNT(*) AS row_count FROM lirs_payer_ids
UNION ALL
SELECT 'lirs_revenue_receipts', COUNT(*) FROM lirs_revenue_receipts;

-- Verify RLS policies exist
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('lirs_payer_ids', 'lirs_revenue_receipts')
ORDER BY tablename, policyname;
