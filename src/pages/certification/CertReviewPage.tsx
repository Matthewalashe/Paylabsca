// ============================================================
// CertReviewPage.tsx — Certification Officer review page
// ============================================================
// Scrollable single-column layout for reliability
// Invoice preview + review controls with confirm modals
// ============================================================

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useInvoiceStore } from "@/lib/invoice-store";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft, Stamp, PenTool, CheckCircle, XCircle, Eye,
  AlertTriangle, Shield, FileText,
} from "lucide-react";

export default function CertReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoice } = useInvoiceStore();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const invoice = getInvoice(id || "");
  const [stampApplied, setStampApplied] = useState(false);
  const [signatureApplied, setSignatureApplied] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Confirm modals
  const [showStampConfirm, setShowStampConfirm] = useState(false);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-500 mb-6">This invoice may have been deleted or doesn't exist.</p>
          <Button variant="outline" onClick={() => navigate("/certification")}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const canApprove = stampApplied && signatureApplied;

  const handleApprove = () => {
    updateInvoice(invoice.id, {
      status: "approved",
      approvedBy: user?.id,
      approvedAt: new Date().toISOString(),
    });
    addNotification({
      type: "approval",
      title: "Invoice Approved ✅",
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.clientName} has been certified and approved. You can now send it to the client.`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      fromUser: user?.name,
      fromRole: "Certification Officer",
      targetRole: "billing_officer",
    });
    setShowApproveConfirm(false);
    navigate("/certification");
  };

  const handleReject = () => {
    if (!rejectionNote.trim()) return;
    updateInvoice(invoice.id, {
      status: "rejected",
      rejectionNote: rejectionNote.trim(),
    });
    addNotification({
      type: "rejection",
      title: "Invoice Rejected ❌",
      message: `Invoice ${invoice.invoiceNumber} was rejected. Note: "${rejectionNote.trim()}"`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      fromUser: user?.name,
      fromRole: "Certification Officer",
      targetRole: "billing_officer",
    });
    setShowRejectConfirm(false);
    navigate("/certification");
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/certification")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Review Invoice</h1>
            <p className="text-sm text-gray-500">{invoice.invoiceNumber} — {invoice.clientName}</p>
          </div>
        </div>
      </div>

      {/* Review Controls Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Summary Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white p-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Client</p>
              <p className="font-bold text-lg">{invoice.clientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Property</p>
              <p className="font-medium">{invoice.propertyAddress}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">LGA</p>
              <p className="font-medium">{invoice.propertyLGA}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Building Use</p>
              <p className="font-medium">{invoice.buildingUse}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Amount</p>
              <p className="font-black text-2xl text-[#D4AF37]">₦{new Intl.NumberFormat("en-NG").format(invoice.totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Certification Actions */}
        <div className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D4AF37]" /> Certification Actions
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Stamp Button */}
            <button
              onClick={() => {
                if (stampApplied) setStampApplied(false);
                else setShowStampConfirm(true);
              }}
              className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                stampApplied
                  ? "border-green-400 bg-green-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 hover:shadow-md"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stampApplied ? "bg-green-100" : "bg-gray-100"}`}>
                <Stamp className={`w-7 h-7 ${stampApplied ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  {stampApplied ? "✅ Stamp Applied" : "Apply Official Stamp"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stampApplied ? "LASBCA Certification Stamp" : "Click to apply certification stamp"}
                </p>
              </div>
            </button>

            {/* Signature Button */}
            <button
              onClick={() => {
                if (signatureApplied) setSignatureApplied(false);
                else setShowSignConfirm(true);
              }}
              className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                signatureApplied
                  ? "border-green-400 bg-green-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 hover:shadow-md"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${signatureApplied ? "bg-green-100" : "bg-gray-100"}`}>
                <PenTool className={`w-7 h-7 ${signatureApplied ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  {signatureApplied ? "✅ Signature Applied" : "Apply Digital Signature"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {signatureApplied ? `Signed by ${user?.name}` : "Click to sign the invoice digitally"}
                </p>
              </div>
            </button>
          </div>

          {/* Status & Action Buttons */}
          {canApprove && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-semibold">Ready to approve — stamp & signature applied</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={!canApprove}
              onClick={() => setShowApproveConfirm(true)}
              className="flex-1 sm:flex-none"
            >
              <CheckCircle className="w-5 h-5" /> Certify & Approve
            </Button>

            {!showRejectForm ? (
              <Button
                variant="outline"
                size="lg"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex-1 sm:flex-none"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="w-5 h-5" /> Reject Invoice
              </Button>
            ) : (
              <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 mt-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-sm text-red-800">Rejection Note (required)</h4>
                </div>
                <p className="text-xs text-red-600">
                  Please explain what needs to be corrected. The Billing Officer will receive this note.
                </p>
                <Textarea
                  placeholder="e.g., Photo #3 is blurry, address needs plot number, wrong LGA selected..."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="border-red-200 focus:ring-red-300"
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={!rejectionNote.trim()}
                    onClick={() => setShowRejectConfirm(true)}
                  >
                    <XCircle className="w-4 h-4" /> Reject Invoice
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowRejectForm(false); setRejectionNote(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-200">
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Preview</span>
        </div>
      </div>

      <div className="flex justify-center pb-10 w-full overflow-x-auto">
        <div className="shadow-2xl rounded-lg overflow-hidden border border-gray-200 transform lg:scale-100 scale-[0.6] origin-top">
          <InvoiceTemplate
            invoice={invoice}
            showStamp={stampApplied}
            showSignature={signatureApplied}
            showQRCode={canApprove}
            showPayButton={false}
          />
        </div>
      </div>

      {/* ===== CONFIRM MODALS ===== */}
      <ConfirmModal
        open={showStampConfirm}
        onClose={() => setShowStampConfirm(false)}
        onConfirm={() => { setStampApplied(true); setShowStampConfirm(false); }}
        title="Apply Official Stamp?"
        message="This will apply the LASBCA Building Certification Department stamp to this invoice. This action can be undone by clicking the stamp button again."
        confirmText="Apply Stamp"
        variant="warning"
      />

      <ConfirmModal
        open={showSignConfirm}
        onClose={() => setShowSignConfirm(false)}
        onConfirm={() => { setSignatureApplied(true); setShowSignConfirm(false); }}
        title="Apply Digital Signature?"
        message={`This will digitally sign this invoice as ${user?.name}. This action can be undone by clicking the signature button again.`}
        confirmText="Sign Invoice"
        variant="warning"
      />

      <ConfirmModal
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Certify & Approve Invoice?"
        message={`You are about to approve invoice ${invoice.invoiceNumber} for ₦${new Intl.NumberFormat("en-NG").format(invoice.totalAmount)}. The Billing Officer will be notified and can send it to ${invoice.clientName}.`}
        confirmText="Approve Invoice"
        variant="success"
      />

      <ConfirmModal
        open={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={handleReject}
        title="Reject This Invoice?"
        message={`This invoice will be sent back to the Billing Officer with your rejection note. They will need to make corrections and resubmit.`}
        confirmText="Reject Invoice"
        variant="danger"
      />
    </div>
  );
}
