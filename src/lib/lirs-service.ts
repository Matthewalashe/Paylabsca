// ============================================================
// lirs-service.ts — LIRS Integration Service
// ============================================================
// Generates LIRS-format Payer IDs and Lagos Revenue Receipts.
// Stores everything on the invoice record itself (receipt_data JSONB)
// to avoid PostgREST schema cache issues with new tables.
// ============================================================

import { supabase } from "./supabase";

// ── Types ──

export interface ReceiptData {
  receiptNumber: string;
  assessmentReference: string;
  revenueCode: string;
  agencyCode: string;
  payerId: string;
  payerName: string;
  amount: number;
  paymentMethod: string;
  paymentBank: string;
  transactionRef: string;
  tellerId: string;
  entryId: string;
  securityCode: string;
  receiptDate: string;
  isTest: boolean;
}

// ── Generators ──

function generateReceiptNumber(): string {
  const num = Math.floor(10000000 + Math.random() * 89999999).toString();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `${num}/${code}`;
}

function generateAssessmentRef(invoiceNumber: string): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000000 + Math.random() * 89999999);
  return `LIRS/LASBCA/${year}/${seq}`;
}

function generateEntryId(): string {
  return Math.floor(10000000 + Math.random() * 89999999).toString();
}

function generateSecurityCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateTellerId(): string {
  return `LIRS-${Math.floor(100000000 + Math.random() * 899999999)}`;
}

/**
 * Generate a persistent Payer ID for a client.
 * Format: N-XXXXXXX (individual) or C-XXXXXXX (corporate)
 * Uses a hash of the client name to ensure the same client always gets the same ID.
 */
export function generatePayerId(clientName: string, buildingUse: string): string {
  const prefix = buildingUse === "Residential" ? "N" : "C";
  // Simple hash of client name to produce a consistent 7-digit number
  let hash = 0;
  const normalized = clientName.trim().toUpperCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const num = Math.abs(hash) % 9000000 + 1000000;
  return `${prefix}-${num}`;
}

/**
 * Generate a full revenue receipt and store it on the invoice.
 * Returns the receipt data immediately for display.
 */
export async function generateAndStoreReceipt(
  invoiceId: string,
  clientName: string,
  amount: number,
  revenueCode: string,
  agencyCode: string,
  transactionRef: string,
  buildingUse: string,
): Promise<ReceiptData> {
  const payerId = generatePayerId(clientName, buildingUse);

  const receipt: ReceiptData = {
    receiptNumber: generateReceiptNumber(),
    assessmentReference: generateAssessmentRef(""),
    revenueCode: revenueCode || "4020167",
    agencyCode: agencyCode || "7740103",
    payerId,
    payerName: clientName.trim().toUpperCase(),
    amount,
    paymentMethod: "Web Payment",
    paymentBank: "LIRS Approved Gateway",
    transactionRef,
    tellerId: generateTellerId(),
    entryId: generateEntryId(),
    securityCode: generateSecurityCode(),
    receiptDate: new Date().toISOString(),
    isTest: true,
  };

  // Store on the invoice — fire and forget, non-blocking
  try {
    await supabase
      .from("invoices")
      .update({
        receipt_data: receipt,
        lirs_payer_id: payerId,
      })
      .eq("id", invoiceId);
  } catch (err) {
    console.warn("Could not persist receipt to DB (non-blocking):", err);
  }

  return receipt;
}

/**
 * Get receipt data from an invoice record
 */
export async function getReceiptFromInvoice(invoiceId: string): Promise<ReceiptData | null> {
  const { data } = await supabase
    .from("invoices")
    .select("receipt_data")
    .eq("id", invoiceId)
    .single();

  return data?.receipt_data || null;
}

// ── Formatting helpers ──

export function formatReceiptDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) + " " + date.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatReceiptAmount(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
