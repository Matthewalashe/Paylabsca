import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cnxuszpzbxgpxnjtesca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHVzenB6YnhncHhuanRlc2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTU5MjMsImV4cCI6MjA5MTY5MTkyM30.I1OT_QAhJn-Cv2BpNiLTSrGAhksok6EaTJaAGfNkLDY'
);

async function test() {
  // Sign in as cert officer
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'b.mustapha@lasbca.lg.gov.ng',
    password: 'Certify@2026',
  });
  if (authErr) { console.log('Auth failed:', authErr.message); return; }
  console.log('Signed in as cert officer\n');

  // Get all profiles
  const { data: profiles } = await supabase.from('profiles').select('id, name, email, status, role');
  console.log('All profiles:');
  profiles?.forEach(p => console.log(`  ${p.name} | ${p.email} | status=${p.status} | role=${p.role} | id=${p.id}`));

  // Find a non-admin user to test on
  const target = profiles?.find(p => p.email !== 'b.mustapha@lasbca.lg.gov.ng');
  if (!target) { console.log('No target user found'); return; }

  console.log(`\nTesting operations on: ${target.name} (${target.email})`);

  // Test SUSPEND
  console.log('\n--- Test SUSPEND ---');
  const { data: susData, error: susErr, count: susCount, status: susStatus } = await supabase
    .from('profiles')
    .update({ status: 'suspended' })
    .eq('id', target.id)
    .select();
  console.log(`  Status: ${susStatus} | Error: ${susErr?.message || 'none'} | Updated rows: ${susData?.length || 0}`);

  // Verify it changed
  const { data: check1 } = await supabase.from('profiles').select('status').eq('id', target.id).single();
  console.log(`  Verified status: ${check1?.status}`);

  // Test ACTIVATE (revert)
  console.log('\n--- Test ACTIVATE ---');
  const { data: actData, error: actErr, status: actStatus } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', target.id)
    .select();
  console.log(`  Status: ${actStatus} | Error: ${actErr?.message || 'none'} | Updated rows: ${actData?.length || 0}`);

  const { data: check2 } = await supabase.from('profiles').select('status').eq('id', target.id).single();
  console.log(`  Verified status: ${check2?.status}`);

  // Test DELETE
  console.log('\n--- Test DELETE ---');
  const { error: delErr, status: delStatus } = await supabase
    .from('profiles')
    .delete()
    .eq('id', target.id);
  console.log(`  Status: ${delStatus} | Error: ${delErr?.message || 'none'}`);

  // Check if deleted
  const { data: check3 } = await supabase.from('profiles').select('id').eq('id', target.id);
  console.log(`  Remaining rows for that id: ${check3?.length || 0}`);

  // Test sign-in for second user (sarawoods033)
  console.log('\n--- Test sign-in for sarawoods033 ---');
  await supabase.auth.signOut();
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: 'sarawoods033@gmail.com',
    password: 'Test123!',  // We don't know the real password, this will fail
  });
  console.log(`  Result: ${signErr?.message || 'SUCCESS'}`);

  console.log('\n=== Tests Complete ===');
}

test().catch(console.error);
