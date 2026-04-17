import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cnxuszpzbxgpxnjtesca.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHVzenB6YnhncHhuanRlc2NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjExNTkyMywiZXhwIjoyMDkxNjkxOTIzfQ.7nV8AQli6IR7gX_xkO2UDl2Fsb-Gy_Ac2lF7xhpWGrc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const usersToCreate = [
    {
      email: 'b.mustapha@lasbca.lg.gov.ng',
      password: 'Certify@2026',
      name: 'Arc. Bolatito Mustapha',
      role: 'certification_officer',
      phone: '+2348098765432',
      oracle_number: 'ORC-2024-0100'
    },
    {
      email: 'a.ogunlade@lasbca.lg.gov.ng',
      password: 'Billing@2026',
      name: 'Adeyemi Ogunlade',
      role: 'billing_officer',
      phone: '+2348012345678',
      oracle_number: 'ORC-2024-0451'
    }
  ];

  for (const u of usersToCreate) {
    // 1. Create the user
    console.log(`Creating auth user: ${u.email}`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`User ${u.email} already exists.`);
        
        // try to get the user ID
        const { data: listUser } = await supabase.auth.admin.listUsers();
        const existing = listUser.users.find(x => x.email === u.email);
        
        if (existing) {
          // Check if profile exists
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', existing.id).single();
          if (!profile) {
            console.log(`Creating missing profile for ${u.email}`);
            await supabase.from('profiles').insert({
              id: existing.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              oracle_number: u.oracle_number,
              role: u.role,
              status: 'active'
            });
          } else {
             console.log(`Profile for ${u.email} already exists.`);
          }
          
          // Let's reset the password just in case they couldn't log in
          await supabase.auth.admin.updateUserById(existing.id, { password: u.password });
        }
      } else {
        console.error('Error creating auth format:', authError);
      }
    } else if (authData.user) {
      console.log(`User created. Creating profile for ${u.email}`);
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        oracle_number: u.oracle_number,
        role: u.role,
        status: 'active'
      });
      if (profileError) console.error('Profile creation error:', profileError);
    }
  }
}

main().catch(console.error);
