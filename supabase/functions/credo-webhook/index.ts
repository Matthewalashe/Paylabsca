// ============================================================
// credo-webhook — Supabase Edge Function
// ============================================================
// Receives POST webhooks from Credo after successful payments.
// Event: TRANSACTION.SUCCESSFUL
// Matches the invoice by billNumber → invoice_number and marks
// the invoice as paid. Must respond with HTTP 200 to acknowledge.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server not configured");
    }

    const payload = await req.json();
    const { event, data } = payload;

    console.log("[credo-webhook] Received event:", event);

    // Only process successful transactions
    if (event !== "TRANSACTION.SUCCESSFUL") {
      console.log("[credo-webhook] Ignoring non-success event:", event);
      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract fields from webhook payload
    const {
      transRef,
      businessRef,
      billNumber,
      transAmount,
      transFee,
      customerId, // email
      transactionDate,
      receiptNo,
    } = data || {};

    if (!billNumber) {
      console.error("[credo-webhook] No billNumber in payload");
      return new Response(JSON.stringify({ error: "Missing billNumber" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`[credo-webhook] Processing billNumber=${billNumber}, transRef=${transRef}`);

    // Use service_role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find invoice by invoice_number (which is what we sent as billNumber)
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from("invoices")
      .select("id, status")
      .eq("invoice_number", billNumber)
      .single();

    if (fetchError || !invoice) {
      console.error("[credo-webhook] Invoice not found for billNumber:", billNumber, fetchError);
      // Still respond 200 so Credo doesn't retry for unknown invoices
      return new Response(JSON.stringify({ received: true, action: "invoice_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Only update if not already paid (idempotent)
    if (invoice.status === "paid") {
      console.log("[credo-webhook] Invoice already paid, skipping:", invoice.id);
      return new Response(JSON.stringify({ received: true, action: "already_paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Mark as paid
    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        status: "paid",
        paid_at: transactionDate
          ? new Date(transactionDate).toISOString()
          : new Date().toISOString(),
        payment_reference: transRef || businessRef || "",
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("[credo-webhook] Failed to update invoice:", updateError);
      throw updateError;
    }

    console.log(`[credo-webhook] Invoice ${invoice.id} marked as paid`);

    // Respond 200 — Credo will stop retrying
    return new Response(
      JSON.stringify({
        received: true,
        action: "marked_paid",
        invoiceId: invoice.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[credo-webhook] Error:", error.message);
    // Return 200 even on internal errors to prevent infinite retries
    // for malformed payloads. Log the error for investigation.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
