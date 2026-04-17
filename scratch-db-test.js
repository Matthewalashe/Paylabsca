// ============================================================
// scratch-db-test.js — Test Supabase database operations
// ============================================================
// Run: node scratch-db-test.js
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnxuszpzbxgpxnjtesca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHVzenB6YnhncHhuanRlc2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTU5MjMsImV4cCI6MjA5MTY5MTkyM30.I1OT_QAhJn-Cv2BpNiLTSrGAhksok6EaTJaAGfNkLDY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('=== LASBCA Database Diagnostic ===\n');

  // 1. Check if we can connect
  console.log('1. Testing connection...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, email, role, status')
    .limit(10);

  if (profilesError) {
    console.log('   ❌ Profiles query failed:', profilesError.message);
    console.log('   This means either the table does not exist or RLS is blocking unauthenticated access.');
  } else {
    console.log('   ✅ Connection OK. Found', profiles.length, 'profiles');
    profiles.forEach(p => console.log(`      - ${p.name} (${p.role}) [${p.status}]`));
  }

  // 2. Check invoices table
  console.log('\n2. Testing invoices table...');
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, client_name, created_by')
    .limit(10);

  if (invoicesError) {
    console.log('   ❌ Invoices query failed:', invoicesError.message);
  } else {
    console.log('   ✅ Invoices OK. Found', invoices.length, 'invoices');
    invoices.forEach(inv => console.log(`      - ${inv.invoice_number} [${inv.status}] - ${inv.client_name || 'no client'}`));
  }

  // 3. Check notifications table
  console.log('\n3. Testing notifications table...');
  const { data: notifs, error: notifsError } = await supabase
    .from('notifications')
    .select('id, title, type, target_role')
    .limit(5);

  if (notifsError) {
    console.log('   ❌ Notifications query failed:', notifsError.message);
  } else {
    console.log('   ✅ Notifications OK. Found', notifs.length, 'notifications');
  }

  // 4. Check storage buckets
  console.log('\n4. Testing storage buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.log('   ❌ Buckets query failed:', bucketsError.message);
  } else {
    console.log('   ✅ Found', buckets.length, 'buckets');
    buckets.forEach(b => console.log(`      - ${b.id} (public: ${b.public})`));
  }

  // 5. Try to login with a known user to test authenticated operations
  console.log('\n5. Testing authentication...');
  // Try the seed users
  const testUsers = [
    { email: 'billing@lasbca.lg.gov.ng', password: 'billing123' },
    { email: 'cert@lasbca.lg.gov.ng', password: 'cert123' },
  ];

  let authedUser = null;
  for (const testUser of testUsers) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (authError) {
      console.log(`   ❌ Login failed for ${testUser.email}: ${authError.message}`);
    } else {
      console.log(`   ✅ Login success for ${testUser.email}`);
      authedUser = authData;

      // Now test invoice creation
      console.log('\n6. Testing invoice INSERT (authenticated)...');
      const testInvoice = {
        id: crypto.randomUUID(),
        invoice_number: `TEST-${Date.now()}`,
        reference_number: 'TEST-REF',
        status: 'draft',
        issue_date: '2026-04-15',
        due_date: '2026-05-15',
        client_name: 'Test Client',
        client_address: '123 Test Street',
        property_address: '456 Property Avenue',
        property_lga: 'Ikeja',
        building_use: 'Commercial',
        certificate_type: 'completion_fitness',
        certificate_title: 'TEST CERT',
        revenue_code: '4020167',
        agency_code: '7740103',
        line_items: [],
        subtotal: 0,
        total_amount: 0,
        created_by: authData.user.id,
      };

      const { data: insertData, error: insertError } = await supabase
        .from('invoices')
        .insert(testInvoice)
        .select();

      if (insertError) {
        console.log(`   ❌ INSERT failed: ${insertError.message}`);
        console.log(`   Code: ${insertError.code}`);
        console.log(`   Details: ${insertError.details}`);
        console.log(`   Hint: ${insertError.hint}`);
      } else {
        console.log(`   ✅ INSERT success! Invoice created: ${testInvoice.invoice_number}`);

        // Test UPDATE (status to pending_approval)
        console.log('\n7. Testing invoice UPDATE (draft -> pending_approval)...');
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'pending_approval' })
          .eq('id', testInvoice.id);

        if (updateError) {
          console.log(`   ❌ UPDATE failed: ${updateError.message}`);
          console.log(`   Code: ${updateError.code}`);
          console.log(`   This confirms the RLS policy is too restrictive!`);
        } else {
          console.log(`   ✅ UPDATE success! Status changed to pending_approval`);
        }

        // Clean up test invoice
        console.log('\n8. Cleaning up test invoice...');
        // Reset to draft first for delete policy
        await supabase.from('invoices').update({ status: 'draft' }).eq('id', testInvoice.id);
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .eq('id', testInvoice.id);

        if (deleteError) {
          console.log(`   ⚠️ Cleanup failed (not critical): ${deleteError.message}`);
        } else {
          console.log(`   ✅ Test invoice cleaned up`);
        }
      }

      // Sign out
      await supabase.auth.signOut();
      break;
    }
  }

  if (!authedUser) {
    console.log('\n   ⚠️ Could not authenticate with any test user.');
    console.log('   Make sure seed users exist in Supabase Auth.');
  }

  console.log('\n=== Diagnostic Complete ===');
}

runTests().catch(console.error);
