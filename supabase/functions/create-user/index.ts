import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const { email, password, name, phone, oracleNumber, role, department } = await req.json();

    if (!email || !password || !name || !role) {
      throw new Error("Missing required fields: email, password, name, role");
    }

    // 1. Verify caller is a certification_officer
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    if (callerProfile?.role !== 'certification_officer') {
      throw new Error("Forbidden: requires certification_officer role");
    }

    // 2. Create auth user via admin API — email is auto-confirmed
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,  // <-- This is the key: skip email verification
    });

    if (createError || !newUser.user) {
      throw new Error(createError?.message || "Failed to create auth user");
    }

    // 3. Insert profile row (using service role to bypass RLS)
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || "").trim(),
      oracle_number: (oracleNumber || "").trim(),
      role,
      department: department || "Building Certification Department",
      avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
      status: "active",
    });

    if (profileError) {
      // Rollback: delete the auth user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(profileError.message);
    }

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
