// ============================================================
// whatsapp-service.ts — WhatsApp deep link builder for invoices
// ============================================================
// Uses api.whatsapp.com/send to open WhatsApp with a pre-filled
// message. Works on both mobile (opens WhatsApp app) and desktop
// (opens WhatsApp Web).
// ============================================================

import type { InvoiceData } from "./types";
import { formatNaira } from "./types";

/**
 * Normalize a Nigerian phone number to international format (234...).
 * Supports: +234..., 0234..., 0803..., 234..., etc.
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Handle Nigerian formats
  if (digits.startsWith("0") && digits.length === 11) {
    // Local format: 08012345678 → 2348012345678
    digits = "234" + digits.substring(1);
  } else if (digits.startsWith("234") && digits.length === 13) {
    // Already international: 2348012345678
    // keep as is
  } else if (digits.length === 10) {
    // Without leading 0: 8012345678 → 2348012345678
    digits = "234" + digits;
  }

  return digits;
}

/**
 * Build the WhatsApp message body for an invoice.
 */
function buildWhatsAppMessage(invoice: InvoiceData): string {
  const paymentUrl = `${window.location.origin}/pay/${invoice.id}`;
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const amount = `₦${formatNaira(invoice.totalAmount)}`;

  return [
    `*LASBCA — Official Payment Notice*`,
    ``,
    `Dear *${invoice.clientName}*,`,
    ``,
    `Your verified invoice is ready for payment:`,
    ``,
    `📄 *Invoice:* ${invoice.invoiceNumber}`,
    `🏢 *Property:* ${invoice.propertyAddress}`,
    `💰 *Amount Due:* ${amount}`,
    `📅 *Due Date:* ${dueDate}`,
    ``,
    `💳 *Pay securely here:*`,
    paymentUrl,
    ``,
    `_This is an official message from the Lagos State Building Control Agency (LASBCA)._`,
  ].join("\n");
}

/**
 * Build the full WhatsApp deep link URL.
 * Opens WhatsApp with the message pre-filled and addressed to the client's phone.
 */
export function buildWhatsAppUrl(invoice: InvoiceData): string {
  const phone = formatPhoneForWhatsApp(invoice.clientPhone || "");
  const message = encodeURIComponent(buildWhatsAppMessage(invoice));

  if (phone) {
    return `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
  }
  // No phone number — open WhatsApp with just the message (user picks contact)
  return `https://api.whatsapp.com/send?text=${message}`;
}

/**
 * Open WhatsApp with the invoice message in a new tab.
 */
export function sendViaWhatsApp(invoice: InvoiceData): void {
  const url = buildWhatsAppUrl(invoice);
  window.open(url, "_blank", "noopener,noreferrer");
}
