// ============================================================
// email-service.ts — Real email delivery via EmailJS
// ============================================================
// Uses @emailjs/browser to send actual emails from the frontend.
// Minimal template params for maximum compatibility.
// ============================================================

import emailjs from "@emailjs/browser";
import type { InvoiceData } from "./types";
import { formatNaira } from "./types";

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;

let initialized = false;

function ensureInit() {
  if (!initialized && PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
    initialized = true;
  }
}

/** Check if EmailJS is properly configured */
export function isEmailConfigured(): boolean {
  return !!(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);
}

/**
 * Build the HTML email body for the invoice.
 */
function buildEmailHtml(invoice: InvoiceData): string {
  const paymentUrl = `${window.location.origin}/pay/${invoice.id}`;
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const amount = `₦${formatNaira(invoice.totalAmount)}`;

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #003200; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Lagos State Building Control Agency</h1>
    <p style="color: #90EE90; font-size: 12px; margin: 4px 0 0;">Official Billing System</p>
  </div>
  
  <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
    <p style="color: #1f2937; font-size: 15px;">Dear <strong>${invoice.clientName}</strong>,</p>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      Please find your verified invoice <strong>${invoice.invoiceNumber}</strong> for the property located at <strong>${invoice.propertyAddress}</strong>.
    </p>
    
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Total Amount Due</td>
          <td style="text-align: right; font-size: 22px; font-weight: 900; color: #006400;">${amount}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0; border-top: 1px solid #e5e7eb;">Due Date</td>
          <td style="text-align: right; font-weight: 700; color: #1f2937; border-top: 1px solid #e5e7eb; padding: 8px 0;">${dueDate}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0; border-top: 1px solid #e5e7eb;">Invoice No.</td>
          <td style="text-align: right; font-weight: 700; color: #1f2937; font-family: monospace; border-top: 1px solid #e5e7eb; padding: 8px 0;">${invoice.invoiceNumber}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${paymentUrl}" 
         style="display: inline-block; background-color: #006400; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 40px; border-radius: 6px; text-decoration: none;">
        Click Here To Pay Securely
      </a>
    </div>

    <div style="text-align: center; margin: 16px 0;">
      <p style="color: #9ca3af; font-size: 11px; margin-bottom: 8px;">Or copy this payment link:</p>
      <p style="color: #006400; font-size: 12px; word-break: break-all;">
        <a href="${paymentUrl}" style="color: #006400;">${paymentUrl}</a>
      </p>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0;">This is an automated message from the LASBCA Billing System. Do not reply to this email.</p>
    <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">&copy; ${new Date().getFullYear()} Lagos State Government. All rights reserved.</p>
  </div>
</div>
  `.trim();
}

/**
 * Send a real invoice email to the client.
 * Returns true on success, throws on failure with the actual error.
 */
export async function sendInvoiceEmail(invoice: InvoiceData): Promise<boolean> {
  if (!isEmailConfigured()) {
    throw new Error("EmailJS is not configured. Set VITE_EMAILJS_* environment variables.");
  }

  if (!invoice.clientEmail) {
    throw new Error("Client email address is missing from the invoice.");
  }

  const paymentUrl = `${window.location.origin}/pay/${invoice.id}`;

  // Template params — include multiple alias names for maximum compatibility
  // Different EmailJS templates may use different variable names for the recipient
  const templateParams: Record<string, string> = {
    // Recipient — provide multiple aliases so the template picks up whichever one it uses
    to_email: invoice.clientEmail,
    email: invoice.clientEmail,
    email_to: invoice.clientEmail,
    recipient: invoice.clientEmail,
    user_email: invoice.clientEmail,
    // Names
    to_name: invoice.clientName,
    from_name: "LASBCA Billing System",
    // Subject
    subject: `LASBCA Payment Request - ${invoice.invoiceNumber}`,
    // Body content (template should use {{{message}}} for raw HTML)
    message: buildEmailHtml(invoice),
    // Extra fields
    invoice_number: invoice.invoiceNumber,
    total_amount: `₦${formatNaira(invoice.totalAmount)}`,
    payment_url: paymentUrl,
  };

  try {
    // Pass public key as 4th argument for guaranteed authentication
    const response = await emailjs.send(
      SERVICE_ID!,
      TEMPLATE_ID!,
      templateParams,
      PUBLIC_KEY!
    );
    console.log("[EmailJS] Success:", response.status, response.text);
    return true;
  } catch (err: unknown) {
    // EmailJS throws an object with { status, text } on failure
    const errObj = err as { status?: number; text?: string; message?: string };
    const detail = errObj?.text || errObj?.message || JSON.stringify(err);
    console.error("[EmailJS] Failed:", err);
    throw new Error(`Email failed (${errObj?.status || "unknown"}): ${detail}`);
  }
}

