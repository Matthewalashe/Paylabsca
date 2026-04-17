// ============================================================
// InvoiceWorkflow.tsx — Complete approval workflow UI
// ============================================================
// Renders INSIDE AppShell — no standalone header
// FIXED: async/await on submit/send, improved mobile layout
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceTemplate from "./InvoiceTemplate";
import type { InvoiceData, InvoiceStatus } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import ConfirmModal from "@/components/ui/confirm-modal";
import EmailPreview from "./EmailPreview";
import { toast } from "sonner";
import {
  FileText, CheckCircle, Send, Download, Mail,
  ArrowRight, ArrowLeft, XCircle, Clock, Shield,
} from "lucide-react";

interface InvoiceWorkflowProps {
  invoice: InvoiceData;
  onUpdateInvoice: (invoice: InvoiceData) => void;
}

function getStatusConfig(status: InvoiceStatus) {
  const configs: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    draft: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100", icon: FileText },
    pending_approval: { label: "Pending Approval", color: "text-amber-700", bg: "bg-amber-50", icon: Clock },
    approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50", icon: CheckCircle },
    sent: { label: "Sent", color: "text-blue-700", bg: "bg-blue-50", icon: Send },
    paid: { label: "Paid", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
    overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-50", icon: Clock },
    rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50", icon: XCircle },
    cancelled: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100", icon: XCircle },
  };
  return configs[status];
}

const WORKFLOW_STEPS = [
  { id: 1, label: "Create Invoice", icon: FileText, role: "Billing Officer" },
  { id: 2, label: "Review & Approve", icon: Shield, role: "Authorizing Officer" },
  { id: 3, label: "Send to Client", icon: Send, role: "Billing Officer" },
];

function getActiveStep(status: InvoiceStatus): number {
  switch (status) {
    case "draft": return 1;
    case "pending_approval": return 2;
    case "approved": return 3;
    case "rejected": return 1;
    default: return 3;
  }
}

export default function InvoiceWorkflow({ invoice, onUpdateInvoice }: InvoiceWorkflowProps) {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const statusConfig = getStatusConfig(invoice.status);
  const activeStep = getActiveStep(invoice.status);
  const StatusIcon = statusConfig.icon;

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const handleSubmitForApproval = async () => {
    try {
      onUpdateInvoice({ ...invoice, status: "pending_approval", updatedAt: new Date().toISOString() });
      addNotification({
        type: "submission",
        title: "Invoice Resubmitted",
        message: `Invoice ${invoice.invoiceNumber} has been submitted for certification.`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        fromUser: user?.name,
        fromRole: "Billing Officer",
        targetRole: "certification_officer",
      });
      toast.success("Invoice submitted for certification!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit invoice.");
    }
  };

  const handleSendToClient = async () => {
    try {
      onUpdateInvoice({ ...invoice, status: "sent", sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      addNotification({
        type: "info",
        title: "Invoice Sent ✅",
        message: `Invoice ${invoice.invoiceNumber} has been sent successfully to the client.`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        fromUser: "System",
        targetRole: "billing_officer",
      });
      toast.success("Invoice sent to client!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invoice.");
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Invoice Details</h1>
            <p className="text-sm text-gray-500">{invoice.invoiceNumber} — {invoice.clientName}</p>
          </div>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors no-print">
          <Download className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* ===== WORKFLOW STEPPER ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Invoice Workflow</h2>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>
        </div>
        <div className="flex items-center justify-between">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = step.id === activeStep;
            const isCompleted = step.id < activeStep || (invoice.status === 'paid' || invoice.status === 'sent');
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 sm:gap-3 ${isActive ? "opacity-100" : isCompleted ? "opacity-70" : "opacity-40"}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCompleted ? "bg-green-500 text-white" : isActive ? "bg-[#006400] text-white" : "bg-gray-200 text-gray-500"}`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-semibold ${isActive || isCompleted ? "text-gray-900" : "text-gray-500"}`}>{step.label}</p>
                    <p className="text-xs text-gray-500">{step.role}</p>
                  </div>
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${isCompleted ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ACTION PANEL ===== */}
      {invoice.status === "draft" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Draft Status</p>
              <p className="text-sm text-amber-600">This invoice is in draft mode. Submit it for certification.</p>
            </div>
          </div>
          <button onClick={() => setShowSubmitConfirm(true)} className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm w-full sm:w-auto justify-center text-sm sm:text-base flex-shrink-0">
            Submit for Certification <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {invoice.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 no-print">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <h2 className="font-bold text-red-800 text-lg">Invoice Rejected</h2>
          </div>
          {invoice.rejectionNote && (
            <div className="bg-white rounded-lg p-3 border border-red-100 mb-4">
              <p className="text-xs font-semibold text-red-800 uppercase mb-1">Reason for rejection:</p>
              <p className="text-red-700">{invoice.rejectionNote}</p>
            </div>
          )}
          <button
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg"
          >
            Edit & Revise Invoice
          </button>
        </div>
      )}

      {invoice.status === "pending_approval" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 no-print">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-800">Awaiting Certification</p>
            <p className="text-sm text-blue-600">This invoice is with the Certification Officer for review.</p>
          </div>
        </div>
      )}

      {invoice.status === "approved" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Invoice Certified & Approved</p>
                <p className="text-sm text-green-600">Stamp & Signature have been applied. Ready to send.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => setShowEmailPreview(true)} className="flex gap-2 items-center px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg shadow-sm font-medium hover:bg-green-100 flex-1 sm:flex-none justify-center text-sm">
                <Mail className="w-4 h-4" /> Email
              </button>
              <button onClick={() => setShowEmailPreview(true)} className="flex gap-2 items-center px-5 sm:px-6 py-2 bg-[#006400] text-white rounded-lg shadow-sm font-bold hover:bg-[#004d00] flex-1 sm:flex-none justify-center text-sm">
                <Send className="w-4 h-4" /> Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== INVOICE PREVIEW ===== */}
      <div className="flex justify-center w-full overflow-x-auto pb-10">
        <div className="shadow-2xl transform lg:scale-[0.85] scale-[0.5] origin-top">
          <InvoiceTemplate
            invoice={invoice}
            showStamp={["approved", "sent", "paid"].includes(invoice.status)}
            showSignature={["approved", "sent", "paid"].includes(invoice.status)}
            showQRCode={["approved", "sent", "paid"].includes(invoice.status)}
            showPayButton={["sent", "paid"].includes(invoice.status)}
          />
        </div>
      </div>

      {/* ===== CONFIRM MODALS ===== */}
      <ConfirmModal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => { setShowSubmitConfirm(false); handleSubmitForApproval(); }}
        title="Submit for Certification?"
        message={`Invoice ${invoice.invoiceNumber} will be submitted to the Certification Officer for review and approval.`}
        confirmText="Submit Invoice"
        variant="warning"
      />

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <EmailPreview 
          invoice={invoice} 
          onCancel={() => setShowEmailPreview(false)}
          onSend={() => {
            setShowEmailPreview(false);
            handleSendToClient();
          }}
        />
      )}
    </div>
  );
}
