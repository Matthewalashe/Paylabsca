import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cnxuszpzbxgpxnjtesca.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHVzenB6YnhncHhuanRlc2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTU5MjMsImV4cCI6MjA5MTY5MTkyM30.I1OT_QAhJn-Cv2BpNiLTSrGAhksok6EaTJaAGfNkLDY'
);

async function check() {
  console.log('=== Quick Status Check ===\n');

  // 1. Check columns
  const { data: profiles, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) { console.log('Profiles error:', error.message); return; }
  const cols = profiles?.length ? Object.keys(profiles[0]) : [];
  const hasEmailVerified = cols.includes('email_verified');
  console.log(`email_verified column: ${hasEmailVerified ? '✅ EXISTS' : '❌ MISSING (run Block 2)'}`);

  // 2. Check RPC
  const { error: rpcErr } = await supabase.rpc('verify_email_token', { p_token: 'test' });
  const rpcOk = !rpcErr || !rpcErr.message?.includes('does not exist');
  console.log(`verify_email_token RPC: ${rpcOk ? '✅ EXISTS' : '❌ MISSING (run Block 4)'}`);

  // 3. Check RLS - sign in as cert officer and try updating another user
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'b.mustapha@lasbca.lg.gov.ng', password: 'Certify@2026',
  });
  if (authErr) { console.log('Cert officer sign-in:', authErr.message); return; }

  const { data: allProfiles } = await supabase.from('profiles').select('id, name, email, status');
  const target = allProfiles?.find(p => p.email !== 'b.mustapha@lasbca.lg.gov.ng');
  if (target) {
    const { data: updated } = await supabase.from('profiles').update({ status: target.status }).eq('id', target.id).select();
    console.log(`RLS update other user: ${updated?.length ? '✅ ALLOWED' : '❌ BLOCKED (run Block 3)'}`);
  }

  // 4. Check sign-in for sarawoods033
  await supabase.auth.signOut();
  const { error: saraErr } = await supabase.auth.signInWithPassword({
    email: 'sarawoods033@gmail.com', password: 'test',
  });
  // "Invalid login credentials" means auth works (just wrong password)
  // "Email not confirmed" means Block 1 hasn't been run
  const signInStatus = saraErr?.message === 'Invalid login credentials' ? '✅ CONFIRMED' :
    saraErr?.message?.includes('not confirmed') ? '❌ NOT CONFIRMED (run Block 1)' : `⚠️ ${saraErr?.message}`;
  console.log(`sarawoods033 auth status: ${signInStatus}`);

  console.log('\n=== Done ===');
}

check().catch(console.error);
