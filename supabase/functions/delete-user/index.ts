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
    const { userId } = await req.json();

    if (!userId) throw new Error("Missing user ID");

    // 1. Verify caller is a certification_officer
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', userData.user.id).single();
    if (profile?.role !== 'certification_officer') throw new Error("Forbidden: requires certification_officer role");

    // 2. Delete the user via service_role identity. This cascades to profiles.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
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
