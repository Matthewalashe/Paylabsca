// ============================================================
// PaymentPage.tsx — Client-facing LIRS Credo Bill Payment Portal
// ============================================================
// Public page: no auth required.
// Flow: Load invoice → Review → Initialize LIRS Credo → Redirect
// Uses /abc/payment/initialize (LIRS Bill Payment API)
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, callEdgeFunction } from "@/lib/supabase";
import { formatNaira } from "@/lib/types";
import type { InvoiceData } from "@/lib/types";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle, Shield, CreditCard, Lock, Loader2,
  Download, Building2, Calendar, FileText,
  AlertCircle, Copy, CheckCheck, Phone, HelpCircle, MapPin, MessageCircle,
} from "lucide-react";

const CREDO_PUBLIC_KEY = import.meta.env.VITE_CREDO_PUBLIC_KEY || "";

// LIRS Credo base URL — keys starting with "1" are live, "0" are demo
const CREDO_API_BASE = CREDO_PUBLIC_KEY.startsWith("1PUB")
  ? "https://api.credocentral.com"
  : "https://api.credodemo.com";

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
    photos: [],
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

  // We load the invoice directly from Supabase so this page works
  // without the InvoiceStoreProvider (which requires authentication).
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);

  const [step, setStep] = useState<"review" | "processing" | "success" | "error">("review");
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const paymentUrl = `${window.location.origin}/pay/${invoiceId}`;

  // ── Load invoice directly from Supabase (public, no auth) ──
  useEffect(() => {
    if (!invoiceId) return;

    async function loadInvoice() {
      setIsLoadingInvoice(true);
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (error || !data) {
          setInvoice(null);
        } else {
          setInvoice(dbToInvoice(data));
        }
      } catch {
        setInvoice(null);
      } finally {
        setIsLoadingInvoice(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  // ── Check if returning from Credo callback ──
  useEffect(() => {
    const transRef = searchParams.get("transRef");
    if (transRef && invoice && invoice.status !== "paid") {
      setIsInitializing(true);
      setStep("processing");

      callEdgeFunction("verify-payment", {
        transRef,
        invoiceId: invoice.id,
      })
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
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [searchParams, invoice]);

  // ── Auto-skip to success if already paid ──
  useEffect(() => {
    if (invoice?.status === "paid") setStep("success");
  }, [invoice?.status]);

  // ── Loading state ──
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

  // ── Initialize LIRS Credo Bill Payment ──
  const handlePayWithCredo = async () => {
    if (!CREDO_PUBLIC_KEY || CREDO_PUBLIC_KEY.includes("_YOUR_") || CREDO_PUBLIC_KEY.includes("_your_")) {
      handleSimulatedPayment();
      return;
    }

    setIsInitializing(true);
    setErrorMsg("");

    try {
      // LIRS Bill Payment API — POST /abc/payment/initialize
      const response = await fetch(`${CREDO_API_BASE}/abc/payment/initialize`, {
        method: "POST",
        headers: {
          Authorization: CREDO_PUBLIC_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(invoice.totalAmount * 100), // Convert to kobo
          emailAddress: invoice.clientEmail || "client@lasbca.lg.gov.ng",
          phoneNumber: invoice.clientPhone || "",
          billNumber: invoice.invoiceNumber, // LIRS bill number — we use invoice number
          initializeAccount: 1,
          callbackUrl: paymentUrl,
        }),
      });

      const data = await response.json();

      if (data.status === 200 && data.data?.authorizationUrl) {
        // Redirect user to Credo hosted checkout
        window.location.href = data.data.authorizationUrl;
      } else {
        throw new Error(
          data.message || data.data?.message || "Failed to initialize LIRS payment"
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment initialization failed";
      setErrorMsg(msg);
      setIsInitializing(false);
    }
  };

  // ── Simulated payment for demo (when no Credo key) ──
  const handleSimulatedPayment = async () => {
    setIsInitializing(true);
    setStep("processing");

    const simRef = `CREDO-SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    try {
      const result = await callEdgeFunction("verify-payment", {
        transRef: simRef,
        invoiceId: invoice.id,
      });

      if (result.success) {
        setInvoice((prev) => prev ? { ...prev, status: "paid", paidAt: new Date().toISOString(), paystackReference: simRef } : prev);
        setStep("success");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Simulation failed. Server error.");
      setStep("error");
    } finally {
      setIsInitializing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCredoConfigured =
    !!CREDO_PUBLIC_KEY &&
    !CREDO_PUBLIC_KEY.includes("_YOUR_") &&
    !CREDO_PUBLIC_KEY.includes("_your_");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lasbca-logo.png" alt="LASBCA" className="w-10 h-10 rounded-full shadow-sm" />
            <div>
              <h1 className="text-base font-black text-gray-900 leading-tight">LASBCA</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Official Payment Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">256-bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left Column: Payment Steps */}
          <div className="lg:col-span-2 space-y-5">
            {/* Invoice Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#006400]" />
                <h2 className="text-lg font-bold text-gray-900">Invoice Summary</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice No.</span>
                  <span className="font-mono font-bold text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Client</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{invoice.clientName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Property</span>
                  <span className="font-medium text-gray-700 text-right max-w-[200px] text-xs">{invoice.propertyAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge variant={isPaid ? "paid" : "pending"}>
                    {isPaid ? "Paid" : "Awaiting Payment"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-end justify-between">
                  <p className="text-gray-500 text-sm font-medium">Total Due</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#006400]">₦{formatNaira(invoice.totalAmount)}</p>
                </div>
              </div>
            </div>

            {/* Step: Review → Pay */}
            {step === "review" && !isPaid && (
              <div className="space-y-4">
                {/* Error Message */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-800">Payment Error</p>
                      <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* Pay with Credo Button */}
                <Button
                  size="xl"
                  className="w-full text-base sm:text-lg shadow-lg bg-[#006400] hover:bg-[#005000]"
                  onClick={handlePayWithCredo}
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Connecting to LIRS Payment…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> Pay ₦{formatNaira(invoice.totalAmount)}
                    </span>
                  )}
                </Button>

                {/* Credo branding */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>LIRS Approved — Secured by <strong className="text-gray-600">Credo</strong> by eTranzact</span>
                </div>

                {/* Payment methods accepted */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Accepted Payment Methods</p>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {["Visa", "Mastercard", "Verve", "Bank Transfer", "USSD"].map(m => (
                      <span key={m} className="px-2.5 sm:px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-100">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* QR Code + Share */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Share Payment Link</p>
                  <div className="inline-block bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-3">
                    <QRCodeSVG value={paymentUrl} size={100} level="M" />
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3">Scan to open payment portal</p>
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006400] hover:text-[#005000] transition-colors"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Link Copied!" : "Copy Payment Link"}
                  </button>
                </div>

                {!isCredoConfigured && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      <strong>Demo Mode:</strong> Credo API key not configured. Payment will be simulated.
                      Set <code className="bg-amber-100 px-1 rounded">VITE_CREDO_PUBLIC_KEY</code> in your <code className="bg-amber-100 px-1 rounded">.env</code> file for real payments.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Processing */}
            {step === "processing" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
                <p className="text-gray-500 text-sm">Please wait while we confirm your payment…</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>LIRS Approved — Secured by Credo</span>
                </div>
              </div>
            )}

            {/* Step: Error */}
            {step === "error" && (
              <div className="bg-white rounded-2xl border-2 border-red-200 p-6 sm:p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Issue</h2>
                <p className="text-gray-500 text-sm mb-4">{errorMsg || "An error occurred during payment verification."}</p>
                <Button variant="outline" onClick={() => { setStep("review"); setErrorMsg(""); }}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="bg-white rounded-2xl border-2 border-green-200 p-6 sm:p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 mb-6 text-sm">Your payment has been received. The invoice is now fully settled.</p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction Ref</span>
                    <span className="font-mono text-xs font-bold text-gray-900 break-all text-right max-w-[180px]">{invoice.paystackReference}</span>
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

                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" /> Download Receipt
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Invoice Preview */}
          <div className="lg:col-span-3 hidden sm:block">
            <div className="bg-gray-200 p-4 rounded-2xl flex justify-center overflow-hidden border border-gray-300">
              <div className="bg-white shadow-lg transform scale-[0.55] lg:scale-[0.7] origin-top">
                <InvoiceTemplate
                  invoice={invoice}
                  showStamp={true}
                  showSignature={true}
                  showQRCode={true}
                  showPayButton={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTACT US / NEED HELP ===== */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 mt-8 sm:mt-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#006400] to-[#008000] px-5 sm:px-6 py-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-white/80" />
              <h3 className="text-white font-bold text-base">Need Help?</h3>
            </div>
            <p className="text-green-100 text-xs sm:text-sm mt-1">
              If you have any questions, disputes, or need clarification about this invoice, please contact us.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6">
            {/* Phone */}
            <a
              href="tel:+2349024287655"
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <Phone className="w-4.5 h-4.5 text-[#006400]" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Call Us</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">+234 902 428 7655</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://api.whatsapp.com/send?phone=2349024287655&text=Hello%2C%20I%20need%20help%20with%20my%20LASBCA%20invoice%20payment."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <MessageCircle className="w-4.5 h-4.5 text-[#25D366]" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">WhatsApp</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">Chat with us</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:info@lasbca.lg.gov.ng"
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">info@lasbca.lg.gov.ng</p>
              </div>
            </a>

            {/* Office */}
            <div className="flex items-start gap-3 p-3 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Head Office</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">Block C, The Secretariat, Alausa, Ikeja, Lagos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/lasbca-logo.png" alt="" className="w-8 h-8 rounded-full opacity-60" />
            <div>
              <p className="text-sm font-semibold text-gray-700">LASBCA Payment Portal</p>
              <p className="text-xs text-gray-400">Lagos State Building Control Agency</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> LIRS Approved — Powered by Credo</span>
            <span>© {new Date().getFullYear()} Lagos State Government</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
