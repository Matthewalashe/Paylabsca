// ============================================================
// PaymentPage.tsx — Client-facing LIRS Credo Bill Payment Portal
// ============================================================
// Public page: no auth required.
// Desktop: 2-column layout (payment left, invoice preview right)
// Mobile: single-column stacked layout (summary → pay → invoice)
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, callEdgeFunction } from "@/lib/supabase";
import { formatNaira } from "@/lib/types";
import type { InvoiceData } from "@/lib/types";
import InvoicePreviewPanel from "@/components/invoice/InvoicePreviewPanel";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle, Shield, CreditCard, Lock, Loader2,
  Building2, Calendar, FileText, Download,
  AlertCircle, Copy, CheckCheck, Phone, HelpCircle, MapPin, MessageCircle,
} from "lucide-react";

const CREDO_PUBLIC_KEY = import.meta.env.VITE_CREDO_PUBLIC_KEY || "";
const CREDO_API_BASE = CREDO_PUBLIC_KEY.startsWith("1PUB")
  ? "https://api.credocentral.com"
  : "https://api.credodemo.com";

/** True when using Credo demo/sandbox keys (0PUB prefix) */
const IS_DEMO_ENV = !CREDO_PUBLIC_KEY.startsWith("1PUB");

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

export default function PaymentPage() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);

  const [step, setStep] = useState<"review" | "processing" | "success" | "error">("review");
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showTestFallback, setShowTestFallback] = useState(false);

  const paymentUrl = `${window.location.origin}/pay/${invoiceId}`;

  // ── Load invoice ──
  useEffect(() => {
    if (!invoiceId) return;
    async function loadInvoice() {
      setIsLoadingInvoice(true);
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
        setIsLoadingInvoice(false);
      }
    }
    loadInvoice();
  }, [invoiceId]);

  // ── Credo callback ──
  useEffect(() => {
    const transRef = searchParams.get("transRef");
    if (transRef && invoice && invoice.status !== "paid") {
      setIsInitializing(true);
      setStep("processing");
      callEdgeFunction("verify-payment", { transRef, invoiceId: invoice.id })
        .then((result) => {
          if (result.success) {
            setInvoice((prev) => prev ? { ...prev, status: "paid", paidAt: new Date().toISOString(), paystackReference: transRef } : prev);
            setStep("success");
          } else {
            setErrorMsg("Payment verification failed. Please contact support.");
            setStep("error");
          }
        })
        .catch((err) => {
          console.error("Verification error:", err);
          setErrorMsg("Error verifying payment with server.");
          setStep("error");
        })
        .finally(() => setIsInitializing(false));
    }
  }, [searchParams, invoice]);

  // ── Auto-skip to success if already paid ──
  useEffect(() => {
    if (invoice?.status === "paid") setStep("success");
  }, [invoice?.status]);

  // ── Loading ──
  if (isLoadingInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#006400] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading invoice…</p>
      </div>
    );
  }

  // ── Not found ──
  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
        <p className="text-gray-500 mb-6 text-center">The payment link may be invalid or expired.</p>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const isCredoConfigured = !!CREDO_PUBLIC_KEY && !CREDO_PUBLIC_KEY.includes("_YOUR_") && !CREDO_PUBLIC_KEY.includes("_your_");

  const handlePayWithCredo = async () => {
    if (!isCredoConfigured) { handleTestPayment(); return; }
    setIsInitializing(true);
    setErrorMsg("");
    setShowTestFallback(false);
    try {
      const response = await fetch(`${CREDO_API_BASE}/abc/payment/initialize`, {
        method: "POST",
        headers: { Authorization: CREDO_PUBLIC_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(invoice.totalAmount * 100),
          emailAddress: invoice.clientEmail || "client@lasbca.lg.gov.ng",
          phoneNumber: invoice.clientPhone || "",
          billNumber: invoice.referenceNumber || invoice.invoiceNumber,
          initializeAccount: 1,
          callbackUrl: paymentUrl,
        }),
      });
      const data = await response.json();
      if (data.status === 200 && data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        const msg = data.message || data.data?.message || "Failed to initialize LIRS payment";
        // If the reference doesn't exist or bill type is wrong, show the test fallback
        const isRefError = /reference does not exist|reconfirm reference|check bill type/i.test(msg);
        if (isRefError || IS_DEMO_ENV) {
          setShowTestFallback(true);
        }
        throw new Error(msg);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Payment initialization failed");
      // Also show test fallback in demo environments
      if (IS_DEMO_ENV) setShowTestFallback(true);
      setIsInitializing(false);
    }
  };

  /** Test/Demo payment — writes to the real DB so receipt & dashboard work */
  const handleTestPayment = async () => {
    setIsInitializing(true);
    setStep("processing");
    setErrorMsg("");
    setShowTestFallback(false);

    // Simulate a 3-second payment processing delay for realism
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const now = new Date();
      // Generate a realistic-looking payment reference
      const testRef = `CREDO-TEST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: now.toISOString(),
          payment_reference: testRef,
        })
        .eq("id", invoice.id);

      if (error) throw error;

      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: "paid",
              paidAt: now.toISOString(),
              paystackReference: testRef,
            }
          : prev
      );
      setStep("success");
    } catch (err) {
      console.error("Test payment error:", err);
      setErrorMsg("Test payment failed — check your database connection.");
      setStep("error");
    } finally {
      setIsInitializing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* ═══════ Header ═══════ */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/lasbca-logo.png" alt="LASBCA" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm" />
            <div>
              <h1 className="text-sm sm:text-base font-black text-gray-900 leading-tight">LASBCA</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Official Payment Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-semibold hidden xs:inline">256-bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* ═══════ Main Content — responsive 2-column on desktop, 1-column on mobile ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="grid lg:grid-cols-5 gap-5 lg:gap-8">

          {/* ─── Left Column: Payment Actions ─── */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">

            {/* Invoice Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#006400]" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Invoice Summary</h2>
                </div>
                <div className="space-y-2.5 sm:space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice No.</span>
                    <span className="font-mono font-bold text-gray-900">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500">Client</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[55%] break-words">{invoice.clientName}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 flex items-center gap-1 flex-shrink-0"><Building2 className="w-3.5 h-3.5" /> Property</span>
                    <span className="font-medium text-gray-700 text-right max-w-[55%] text-xs break-words">{invoice.propertyAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due Date</span>
                    <span className="font-semibold text-gray-900">{dueDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={isPaid ? "paid" : "pending"}>{isPaid ? "Paid" : "Awaiting Payment"}</Badge>
                  </div>
                </div>
              </div>
              {/* Total bar */}
              <div className="bg-gradient-to-r from-[#006400] to-[#008000] px-4 sm:px-5 py-3 flex items-center justify-between">
                <p className="text-green-100 text-sm font-medium">Total Due</p>
                <p className="text-xl sm:text-2xl font-black text-white">₦{formatNaira(invoice.totalAmount)}</p>
              </div>
            </div>

            {/* Step: Review → Pay */}
            {step === "review" && !isPaid && (
              <div className="space-y-3 sm:space-y-4">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-red-800">Payment Error</p>
                      <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <Button
                  size="xl"
                  className="w-full text-sm sm:text-base shadow-lg bg-[#006400] hover:bg-[#005000] py-3 sm:py-4"
                  onClick={handlePayWithCredo}
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Connecting to LIRS…</span>
                  ) : (
                    <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pay ₦{formatNaira(invoice.totalAmount)}</span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>LIRS Approved — Secured by <strong className="text-gray-600">Credo</strong></span>
                </div>

                {/* Payment methods */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Accepted Payment Methods</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {["Visa", "Mastercard", "Verve", "Bank Transfer", "USSD"].map(m => (
                      <span key={m} className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gray-50 rounded-lg text-[11px] sm:text-xs font-semibold text-gray-600 border border-gray-100">{m}</span>
                    ))}
                  </div>
                </div>

                {/* QR + Share */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm text-center">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Share Payment Link</p>
                  <div className="inline-block bg-white p-1.5 sm:p-2 border border-gray-200 rounded-lg shadow-sm mb-2 sm:mb-3">
                    <QRCodeSVG value={paymentUrl} size={80} level="M" className="sm:w-[100px] sm:h-[100px]" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 mb-2 sm:mb-3">Scan to open payment portal</p>
                  <button onClick={copyLink} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006400] hover:text-[#005000] transition-colors">
                    {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Link Copied!" : "Copy Payment Link"}
                  </button>
                </div>

                {/* Test Payment Fallback — shown when LIRS reference fails or in demo env */}
                {showTestFallback && (
                  <div className="space-y-2.5">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-blue-800">LIRS Reference Issue</p>
                        <p className="text-[11px] sm:text-xs text-blue-700 mt-0.5">
                          The LIRS bill reference could not be validated. You can use the test payment below to verify the full workflow (receipt, dashboard, etc.).
                        </p>
                      </div>
                    </div>
                    <Button
                      size="xl"
                      className="w-full text-sm sm:text-base shadow-lg bg-blue-600 hover:bg-blue-700 py-3 sm:py-4"
                      onClick={handleTestPayment}
                      disabled={isInitializing}
                    >
                      {isInitializing ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processing Test Payment…</span>
                      ) : (
                        <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Test Payment — ₦{formatNaira(invoice.totalAmount)}</span>
                      )}
                    </Button>
                    <p className="text-[10px] text-center text-blue-400">This will mark the invoice as paid in the database for testing purposes.</p>
                  </div>
                )}

                {!isCredoConfigured && !showTestFallback && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 sm:p-3 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-xs text-amber-700">
                      <strong>Demo Mode:</strong> Credo API key not configured. Payment will be simulated.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Processing */}
            {step === "processing" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
                <p className="text-gray-500 text-sm">Please wait while we confirm your payment…</p>
              </div>
            )}

            {/* Step: Error */}
            {step === "error" && (
              <div className="bg-white rounded-2xl border-2 border-red-200 p-6 sm:p-8 shadow-sm text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Payment Issue</h2>
                <p className="text-gray-500 text-sm mb-4">{errorMsg || "An error occurred."}</p>
                <Button variant="outline" onClick={() => { setStep("review"); setErrorMsg(""); }}>Try Again</Button>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="bg-white rounded-2xl border-2 border-green-200 p-5 sm:p-8 shadow-sm text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle className="w-9 h-9 sm:w-10 sm:h-10 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 mb-4 sm:mb-6 text-sm">Your payment has been received. The invoice is now fully settled.</p>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction Ref</span>
                    <span className="font-mono text-xs font-bold text-gray-900 break-all text-right max-w-[50%]">{invoice.paystackReference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-green-700">₦{formatNaira(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-semibold text-gray-900">{new Date(invoice.paidAt || "").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <Badge variant="paid">Paid</Badge>
                  </div>
                </div>
                <a
                  href={`${window.location.origin}/invoice/${invoice.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" /> View & Download Receipt
                </a>
              </div>
            )}
          </div>

          {/* ─── Right Column: Full Invoice Preview ─── */}
          <div className="lg:col-span-3">
            <InvoicePreviewPanel
              invoice={invoice}
              stampUrl={stampUrl}
              signatureUrl={signatureUrl}
            />
          </div>
        </div>
      </div>

      {/* ═══════ Contact / Need Help ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 no-print">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#006400] to-[#008000] px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              <h3 className="text-white font-bold text-sm sm:text-base">Need Help?</h3>
            </div>
            <p className="text-green-100 text-[11px] sm:text-xs mt-1">Questions, disputes, or clarifications — contact us below.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-5">
            <a href="tel:+2349024287655" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006400]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Call Us</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">+234 902 428 7655</p>
              </div>
            </a>
            <a href="https://api.whatsapp.com/send?phone=2349024287655&text=Hello%2C%20I%20need%20help%20with%20my%20LASBCA%20invoice." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">WhatsApp</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">Chat with us</p>
              </div>
            </a>
            <a href="mailto:info@lasbca.lg.gov.ng" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">info@lasbca.lg.gov.ng</p>
              </div>
            </a>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Office</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">Alausa, Ikeja, Lagos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-6 sm:mt-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/lasbca-logo.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-60" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">LASBCA Payment Portal</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Lagos State Building Control Agency</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> LIRS Approved — Powered by Credo</span>
            <span>© {new Date().getFullYear()} Lagos State Government</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
