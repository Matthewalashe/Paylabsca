-- Fix 1: Drop the old restrictive invoice update policy
DROP POLICY IF EXISTS "invoices_update" ON invoices;

-- Fix 1: Create a new policy that lets billing officers update their own invoices
CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer'
    )
  );

-- Fix 2: Add missing DELETE policy for notifications
DROP POLICY IF EXISTS "notif_delete" ON notifications;

CREATE POLICY "notif_delete" ON notifications
  FOR DELETE TO authenticated
  USING (
    target_user_id = auth.uid()
    OR
    target_role = 'all'
    OR
    target_role IN (
      SELECT role FROM profiles WHERE id = auth.uid()
    )
  );

-- Fix 3: Make storage buckets public so getPublicUrl works
UPDATE storage.buckets SET public = true WHERE id = 'invoice-photos';
UPDATE storage.buckets SET public = true WHERE id = 'cert-assets';
