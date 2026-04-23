// ============================================================
// RevenueReceiptPage.tsx — Lagos State Government Revenue Receipt
// ============================================================
// Public page: /receipt/:receiptId (receiptId = invoiceId)
// Reads receipt_data from the invoice record and renders
// a pixel-perfect Lagos Revenue Receipt matching EBS-RCM format.
// ============================================================

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatReceiptAmount, formatReceiptDate } from "@/lib/lirs-service";
import type { ReceiptData } from "@/lib/lirs-service";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Download, Printer, Shield } from "lucide-react";

export default function RevenueReceiptPage() {
  const { receiptId } = useParams(); // This is actually the invoiceId
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!receiptId) return;
    async function load() {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("invoices")
          .select("receipt_data, invoice_number")
          .eq("id", receiptId)
          .single();

        if (data?.receipt_data) {
          setReceipt(data.receipt_data as ReceiptData);
          setInvoiceNumber(data.invoice_number || "");
        }
      } catch {
        setReceipt(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [receiptId]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#006400] animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</h1>
        <p className="text-gray-500 text-sm text-center">
          This receipt has not been generated yet or the link is invalid.
        </p>
      </div>
    );
  }

  const receiptUrl = `${window.location.origin}/receipt/${receiptId}`;
  const receiptDate = new Date(receipt.receiptDate);
  const formattedDate = formatReceiptDate(receipt.receiptDate);
  const formattedAmount = formatReceiptAmount(receipt.amount);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar */}
      <div className="no-print bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lirs-logo.png" alt="LIRS" className="w-8 h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <h1 className="text-sm font-bold text-gray-900">Lagos Revenue Receipt</h1>
              <p className="text-[10px] text-gray-500">Electronic Banking System — Revenue Collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006400] rounded-lg hover:bg-[#005000] transition-colors">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Container */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white border border-gray-300 shadow-lg mx-auto print-receipt relative" style={{ maxWidth: "800px" }}>

          {/* Test watermark */}
          {receipt.isTest && (
            <div className="no-print" style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%) rotate(-35deg)",
              fontSize: "80px", fontWeight: 900, color: "rgba(0,100,0,0.06)",
              whiteSpace: "nowrap", pointerEvents: "none", zIndex: 1, letterSpacing: "8px",
            }}>DEMO MODE</div>
          )}

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #004d00 0%, #006400 50%, #008000 100%)",
              padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "white", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QRCodeSVG value={receiptUrl} size={64} level="M" />
                </div>
                <div>
                  <div style={{ color: "white", fontSize: "18px", fontWeight: 900, letterSpacing: "1px" }}>REVENUE RECEIPT</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>Lagos State Government</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", marginTop: "1px" }}>Electronic Banking System — Revenue Collection & Management</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src="/lagos-seal.svg" alt="Lagos State" style={{ width: "52px", height: "52px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <img src="/lirs-logo.png" alt="LIRS" style={{ width: "52px", height: "52px", borderRadius: "4px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            </div>

            {/* Receipt Number Bar */}
            <div style={{ background: "#f0f0f0", borderBottom: "2px solid #006400", padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600 }}>RECEIPT NO.</span>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#006400", fontFamily: "monospace", letterSpacing: "1px" }}>{receipt.receiptNumber}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600 }}>DATE & TIME</span>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>{formattedDate}</div>
              </div>
            </div>

            {/* Payer Information */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#006400", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", borderBottom: "1px solid #e8e8e8", paddingBottom: "4px" }}>Payer Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#888", fontWeight: 600 }}>Payer Name</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#111" }}>{receipt.payerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#888", fontWeight: 600 }}>Payer ID</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#006400", fontFamily: "monospace" }}>{receipt.payerId}</div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#006400", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px", borderBottom: "1px solid #e8e8e8", paddingBottom: "4px" }}>Payment Details</div>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Assessment Reference", receipt.assessmentReference, true],
                    ["Revenue Code", receipt.revenueCode, true],
                    ["Agency Code", receipt.agencyCode, true],
                    ["Agency Description", "LASBCA — Lagos State Building Control Agency", false],
                    ["Payment Method", receipt.paymentMethod, false],
                    ["Bank / Gateway", receipt.paymentBank, false],
                    ["Transaction Reference", receipt.transactionRef, true],
                    ["Teller ID", receipt.tellerId, true],
                  ].map(([label, value, isMono], i) => (
                    <tr key={i} style={{ background: i % 2 === 1 ? "#fafafa" : "transparent" }}>
                      <td style={{ padding: "6px 4px", color: "#666", width: "40%", fontWeight: 600 }}>{label as string}</td>
                      <td style={{ padding: "6px 0", fontWeight: 700, color: "#111", fontFamily: isMono ? "monospace" : "inherit", fontSize: isMono ? "11px" : "12px" }}>{value as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Amount */}
            <div style={{ padding: "16px 24px", background: "linear-gradient(135deg, #006400 0%, #008000 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Amount Paid Into Consolidated Revenue Account</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>Lagos State Government Treasury</div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "white" }}>₦{formattedAmount}</div>
            </div>

            {/* Security / Verification */}
            <div style={{ padding: "16px 24px", borderTop: "2px solid #006400", background: "#f8f9fa" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#006400", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Receipt Verification</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
                {[
                  ["Entry ID", receipt.entryId],
                  ["Security Code", receipt.securityCode],
                  ["Entry Date", receiptDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })],
                  ["Amount", `₦${formattedAmount}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: "9px", color: "#888", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#333", fontFamily: "monospace" }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "12px", padding: "8px 12px", background: "#e8f5e9", borderRadius: "6px", fontSize: "10px", color: "#2e7d32", lineHeight: "1.5" }}>
                <strong>Verify this receipt:</strong> Visit <span style={{ fontWeight: 700 }}>lagos.ebs-rcm.com</span> → Quick Receipt Validation → Enter the Entry ID, Security Code, Entry Date, and Amount above.
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src="/lagos-seal.svg" alt="" style={{ width: "24px", height: "24px", opacity: 0.5 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>Lagos State Government</div>
                  <div style={{ fontSize: "9px", color: "#999" }}>Revenue Collection & Management System</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "#999" }}>Helpdesk: 0708-011-2233 | 0708-044-5566</div>
                <div style={{ fontSize: "9px", color: "#999" }}>helpdesk@ebsrcm.com | © {new Date().getFullYear()} EBS-RCM</div>
              </div>
            </div>

            {/* Test mode banner */}
            {receipt.isTest && (
              <div style={{ padding: "8px 24px", background: "#fff3e0", borderTop: "2px solid #ff9800", textAlign: "center", fontSize: "11px", color: "#e65100", fontWeight: 700 }}>
                ⚠ TEST / DEMO MODE — This is a simulated receipt for development purposes only. Not valid for official use.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-receipt { border: none !important; box-shadow: none !important; max-width: 100% !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}
