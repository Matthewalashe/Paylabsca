// ============================================================
// verify-payment — Supabase Edge Function
// ============================================================
// Verifies a Credo LIRS Bill Payment transaction server-side
// using GET /abc/{transRef}/verify, then marks the invoice paid.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const credoSecretKey = Deno.env.get("CREDO_SECRET_KEY") || "";
    const { transRef, invoiceId } = await req.json();

    if (!transRef || !invoiceId) throw new Error("Missing parameters");

    // Determine environment — keys starting with "1" are live
    const CREDO_API_BASE = credoSecretKey.startsWith("1SEC") || credoSecretKey.startsWith("1PUB")
      ? "https://api.credocentral.com"
      : "https://api.credodemo.com";

    let isPaid = false;

    if (credoSecretKey) {
      // ── LIRS Bill Payment verification: GET /abc/{transRef}/verify ──
      const response = await fetch(`${CREDO_API_BASE}/abc/${transRef}/verify`, {
        method: "GET",
        headers: {
          Authorization: credoSecretKey,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      // LIRS Credo status codes: 0 = SUCCESS, 5 = SETTLED
      if (data.status === 200 && (data.data?.status === 0 || data.data?.status === 5)) {
        isPaid = true;
      }
    } else {
      // No secret key configured — allow simulated/test payments in demo
      if (transRef.startsWith("CREDO-SIM-") || transRef.startsWith("CREDO-TEST-")) {
        isPaid = true;
      } else {
        throw new Error("Payment gateway not fully configured.");
      }
    }

    if (!isPaid) {
      throw new Error("Payment verification failed.");
    }

    // ── Update invoice status using service_role ──
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_reference: transRef,
      })
      .eq("id", invoiceId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, status: "paid" }), {
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
