-- ============================================================
-- LASBCA Database Schema — Run this in Supabase SQL Editor
-- ============================================================
-- Go to: https://supabase.com/dashboard/project/cnxuszpzbxgpxnjtesca/sql
-- Paste this entire file and press "Run"
-- ============================================================

-- 1. PROFILES (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  oracle_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('billing_officer', 'certification_officer')),
  department TEXT DEFAULT 'Building Certification Department',
  avatar TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  reference_number TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','sent','paid','overdue','rejected','cancelled')),
  issue_date DATE,
  due_date DATE,
  client_name TEXT,
  client_address TEXT,
  client_phone TEXT,
  client_email TEXT,
  property_address TEXT,
  property_lga TEXT,
  building_use TEXT,
  coordinates JSONB DEFAULT '{"latitude":0,"longitude":0}',
  certificate_type TEXT,
  certificate_title TEXT,
  revenue_code TEXT,
  agency_code TEXT,
  line_items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  rejection_note TEXT,
  payment_reference TEXT,
  payment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INVOICE PHOTOS
CREATE TABLE IF NOT EXISTS invoice_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  position INT DEFAULT 1,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('approval','rejection','submission','payment','info')),
  title TEXT NOT NULL,
  message TEXT,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_number TEXT,
  target_role TEXT,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_user TEXT,
  from_role TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CERT ASSETS (stamps, signatures)
CREATE TABLE IF NOT EXISTS cert_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stamp', 'signature')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_role, target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
-- Cert officers can insert new profiles (user creation)
CREATE POLICY "profiles_insert_cert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer'));

-- INVOICES: All authenticated users can read
CREATE POLICY "invoices_select" ON invoices FOR SELECT TO authenticated USING (true);
-- Billing officers can insert
CREATE POLICY "invoices_insert" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
-- Billing officers can update own drafts, cert officers can update any
CREATE POLICY "invoices_update" ON invoices FOR UPDATE TO authenticated USING (true);
-- Only drafts can be deleted by creator
CREATE POLICY "invoices_delete" ON invoices FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND status = 'draft');

-- INVOICE PHOTOS: Follow invoice access
CREATE POLICY "photos_select" ON invoice_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "photos_insert" ON invoice_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "photos_delete" ON invoice_photos FOR DELETE TO authenticated USING (true);

-- NOTIFICATIONS: Users see own notifications
CREATE POLICY "notif_select" ON notifications FOR SELECT TO authenticated
  USING (target_user_id = auth.uid() OR target_role IN (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) OR target_role = 'all');
CREATE POLICY "notif_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif_update" ON notifications FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid() OR target_role IN (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) OR target_role = 'all');

-- CERT ASSETS: Owner access + readable by all authenticated
CREATE POLICY "assets_select" ON cert_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_insert" ON cert_assets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "assets_update" ON cert_assets FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- AUDIT LOG: Readable by cert officers, insertable by all
CREATE POLICY "audit_select" ON audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'certification_officer'));
CREATE POLICY "audit_insert" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS (run separately if needed)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-photos', 'invoice-photos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cert-assets', 'cert-assets', false);

-- ============================================================
-- DONE. Your database is ready.
-- ============================================================
