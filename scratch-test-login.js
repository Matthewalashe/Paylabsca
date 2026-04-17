import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cnxuszpzbxgpxnjtesca.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHVzenB6YnhncHhuanRlc2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTU5MjMsImV4cCI6MjA5MTY5MTkyM30.I1OT_QAhJn-Cv2BpNiLTSrGAhksok6EaTJaAGfNkLDY';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testLogin() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'b.mustapha@lasbca.lg.gov.ng',
    password: 'Certify@2026'
  });

  if (error) {
    console.error("Login Error:", error.message);
  } else {
    console.log("Login Success! User:", data.user.email);
  }
}

testLogin();
