import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnxuszpzbxgpxnjtesca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHVzenB6YnhncHhuanRlc2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTU5MjMsImV4cCI6MjA5MTY5MTkyM30.I1OT_QAhJn-Cv2BpNiLTSrGAhksok6EaTJaAGfNkLDY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login with users from seed.sql...\n');

  const users = [
    { email: 'b.mustapha@lasbca.lg.gov.ng', password: 'Certify@2026', role: 'Certification Officer' },
    { email: 'a.ogunlade@lasbca.lg.gov.ng', password: 'Billing@2026', role: 'Billing Officer 1' },
    { email: 'f.adebayo@lasbca.lg.gov.ng', password: 'Billing@2026', role: 'Billing Officer 2' }
  ];

  for (const user of users) {
    console.log(`Trying ${user.role} (${user.email})...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log(`✅ Success! Logged in as user ID: ${data.user.id}`);
      await supabase.auth.signOut();
    }
    console.log('---');
  }
}

testLogin();
