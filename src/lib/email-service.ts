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
  const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
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

    <div style="text-align: center; margin: 12px 0 20px;">
      <a href="${invoiceUrl}" 
         style="display: inline-block; background-color: #f3f4f6; color: #374151; font-weight: 600; font-size: 13px; padding: 10px 28px; border-radius: 6px; text-decoration: none; border: 1px solid #e5e7eb;">
        📄 View &amp; Download Full Invoice
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

// ============================================================
// Email Verification System (replaces broken Supabase SMTP)
// ============================================================

function buildVerificationEmailHtml(params: {
  name: string;
  email: string;
  token: string;
  password?: string;
  role?: string;
}): string {
  const verifyUrl = `${window.location.origin}/verify-email?token=${params.token}`;
  const isNewAccount = !!params.password;
  const roleName = params.role === "certification_officer"
    ? "Certification Officer"
    : "Billing Officer";

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #003200; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Lagos State Building Control Agency</h1>
    <p style="color: #90EE90; font-size: 12px; margin: 4px 0 0;">Official Billing System — Email Verification</p>
  </div>
  <div style="padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb;">
    <p style="color: #1f2937; font-size: 15px;">Dear <strong>${params.name}</strong>,</p>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      ${isNewAccount
        ? "Your LASBCA Digital Portal account has been created. Please verify your email address by clicking the button below."
        : "Please verify your email address by clicking the button below."}
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #006400; color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 48px; border-radius: 8px; text-decoration: none; letter-spacing: 0.5px;">
        ✓ Verify My Email
      </a>
    </div>

    <div style="text-align: center; margin: 12px 0 20px;">
      <p style="color: #9ca3af; font-size: 11px; margin-bottom: 6px;">Or copy and paste this link into your browser:</p>
      <p style="color: #006400; font-size: 12px; word-break: break-all;">
        <a href="${verifyUrl}" style="color: #006400;">${verifyUrl}</a>
      </p>
    </div>

    ${isNewAccount ? `
    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
      <p style="color: #166534; font-size: 13px; font-weight: 700; margin: 0 0 10px;">Your Login Credentials</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Email</td>
          <td style="text-align: right; font-weight: 700; color: #1f2937; font-family: monospace; font-size: 13px;">${params.email}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0; border-top: 1px solid #dcfce7;">Password</td>
          <td style="text-align: right; font-weight: 700; color: #1f2937; font-family: monospace; font-size: 13px; border-top: 1px solid #dcfce7;">${params.password}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 13px; padding: 6px 0; border-top: 1px solid #dcfce7;">Role</td>
          <td style="text-align: right; font-weight: 700; color: #006400; font-size: 13px; border-top: 1px solid #dcfce7;">${roleName}</td>
        </tr>
      </table>
    </div>
    ` : ""}

    <div style="background-color: #FEF3C7; padding: 12px 16px; border-radius: 6px; border: 1px solid #F59E0B; margin: 16px 0;">
      <p style="color: #92400E; font-size: 12px; margin: 0; line-height: 1.5;">
        <strong>⚠ Security:</strong> ${isNewAccount ? "Change your password after first sign-in. " : ""}Do not share this email. This verification link is single-use.
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
 * Send a verification email to a user.
 * Used for new account creation (includes credentials) and resend requests.
 * Does NOT throw on failure — account creation should still succeed.
 */
export async function sendVerificationEmail(params: {
  name: string;
  email: string;
  token: string;
  password?: string;
  role?: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("[EmailJS] Not configured — skipping verification email.");
    return false;
  }

  ensureInit();

  const subject = params.password
    ? "LASBCA Portal — Verify Your Email & Account Credentials"
    : "LASBCA Portal — Verify Your Email Address";

  const templateParams: Record<string, string> = {
    to_email: params.email,
    email: params.email,
    email_to: params.email,
    recipient: params.email,
    user_email: params.email,
    to_name: params.name,
    from_name: "LASBCA Billing System",
    subject,
    message: buildVerificationEmailHtml(params),
  };

  try {
    const response = await emailjs.send(SERVICE_ID!, TEMPLATE_ID!, templateParams, PUBLIC_KEY!);
    console.log("[EmailJS] Verification email sent:", response.status, response.text);
    return true;
  } catch (err: unknown) {
    console.error("[EmailJS] Verification email failed:", err);
    return false;
  }
}
