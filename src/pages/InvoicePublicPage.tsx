// ============================================================
// InvoicePublicPage.tsx — Clean public invoice view & download
// ============================================================
// Shows ONLY the invoice document with a download button and
// a subtle link to the payment page. No portal chrome.
// ============================================================

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { InvoiceData } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import InvoicePreviewPanel from "@/components/invoice/InvoicePreviewPanel";
import { Loader2, Shield, CreditCard } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#006400] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading invoice…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
        <p className="text-gray-500 text-center">The link may be invalid or the invoice has been removed.</p>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Invoice content — just the preview panel with toolbar */}
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        <InvoicePreviewPanel
          invoice={invoice}
          stampUrl={stampUrl}
          signatureUrl={signatureUrl}
        />

        {/* Pay Now link (if not paid) */}
        {!isPaid && (
          <div className="mt-4 sm:mt-5 text-center no-print">
            <Link
              to={`/pay/${invoice.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#006400] hover:bg-[#005000] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Pay ₦{formatNaira(invoice.totalAmount)}
            </Link>
          </div>
        )}

        {isPaid && (
          <div className="mt-4 sm:mt-5 text-center no-print">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 font-bold text-sm rounded-xl">
              ✓ This invoice has been paid
            </span>
          </div>
        )}

        {/* Minimal footer */}
        <div className="text-center mt-6 pb-4 no-print">
          <p className="text-[10px] sm:text-xs text-gray-400">
            © {new Date().getFullYear()} Lagos State Building Control Agency. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
