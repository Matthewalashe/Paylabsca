// ============================================================
// InvoicePublicPage.tsx — Public invoice view & download page
// ============================================================
// Accessed via /invoice/:invoiceId from WhatsApp/Email links.
// Shows the full invoice with download. No payment actions.
// Has a link to the payment page.
// Desktop: full-width invoice preview
// Mobile: scaled preview that fits the viewport
// ============================================================

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { InvoiceData } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import InvoicePreviewPanel from "@/components/invoice/InvoicePreviewPanel";
import {
  Loader2, Shield, CreditCard, Lock,
} from "lucide-react";

/** Convert a Supabase DB row into the frontend InvoiceData shape */
function dbToInvoice(row: any): InvoiceData {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    referenceNumber: row.reference_number || "",
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    clientName: row.client_name || "",
    clientAddress: row.client_address || "",
    clientPhone: row.client_phone || "",
    clientEmail: row.client_email || "",
    propertyAddress: row.property_address || "",
    propertyLGA: row.property_lga || "Ikeja",
    buildingUse: row.building_use || "Commercial",
    coordinates: row.coordinates || { latitude: 0, longitude: 0 },
    photos: Array.isArray(row.invoice_photos)
      ? row.invoice_photos
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          .map((p: any) => {
            try {
              const { data } = supabase.storage.from("invoice-photos").getPublicUrl(p.storage_path);
              return { id: p.id, url: data?.publicUrl || "", position: p.position as any, caption: p.caption || "" };
            } catch {
              return { id: p.id, url: "", position: p.position, caption: "" };
            }
          })
      : [],
    certificateType: row.certificate_type || "completion_fitness",
    certificateTitle: row.certificate_title || "",
    revenueCode: row.revenue_code || "",
    agencyCode: row.agency_code || "",
    lineItems: row.line_items || [],
    subtotal: Number(row.subtotal) || 0,
    totalAmount: Number(row.total_amount) || 0,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    notes: row.notes,
    rejectionNote: row.rejection_note,
    paystackReference: row.payment_reference,
    paymentLink: row.payment_link,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function InvoicePublicPage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;
    async function load() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*, invoice_photos(*)")
          .eq("id", invoiceId)
          .single();
        if (error || !data) {
          setInvoice(null);
        } else {
          setInvoice(dbToInvoice(data));
          if (data.approved_by) {
            const { data: certData } = await supabase
              .from("cert_assets")
              .select("*")
              .eq("user_id", data.approved_by);
            if (certData) {
              for (const row of certData) {
                const { data: pubData } = supabase.storage.from("cert-assets").getPublicUrl(row.storage_path);
                if (row.asset_type === "stamp") setStampUrl(pubData.publicUrl);
                else setSignatureUrl(pubData.publicUrl);
              }
            }
          }
        }
      } catch {
        setInvoice(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [invoiceId]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#006400] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading invoice…</p>
      </div>
    );
  }

  // ── Not Found ──
  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
        <p className="text-gray-500 mb-6 text-center">The link may be invalid or the invoice has been removed.</p>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/lasbca-logo.png" alt="LASBCA" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm" />
            <div>
              <h1 className="text-sm sm:text-base font-black text-gray-900 leading-tight">LASBCA</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Official Invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pay Now link — only if not paid */}
            {!isPaid && (
              <Link
                to={`/pay/${invoice.id}`}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#006400] hover:bg-[#005000] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Pay ₦{formatNaira(invoice.totalAmount)}</span>
              </Link>
            )}
            {isPaid && (
              <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-lg">
                ✓ Paid
              </span>
            )}
            <div className="flex items-center gap-1 text-gray-400">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] font-semibold hidden sm:inline">Secured</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main: Invoice Preview (centred, full width) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <InvoicePreviewPanel
          invoice={invoice}
          stampUrl={stampUrl}
          signatureUrl={signatureUrl}
        />

        {/* Pay Now CTA below invoice (if not paid) */}
        {!isPaid && (
          <div className="mt-5 sm:mt-6 text-center no-print">
            <Link
              to={`/pay/${invoice.id}`}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#006400] hover:bg-[#005000] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Pay ₦{formatNaira(invoice.totalAmount)}
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-6 sm:mt-10 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/lasbca-logo.png" alt="" className="w-7 h-7 rounded-full opacity-60" />
            <p className="text-xs sm:text-sm font-semibold text-gray-700">LASBCA Invoice Portal</p>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">
            © {new Date().getFullYear()} Lagos State Government. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
