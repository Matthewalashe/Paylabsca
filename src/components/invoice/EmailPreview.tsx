// ============================================================
// EmailPreview.tsx — Real email send with QR code
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/types";
import type { InvoiceData } from "@/lib/types";
import { sendInvoiceEmail, isEmailConfigured } from "@/lib/email-service";
import { QRCodeSVG } from "qrcode.react";
import { Mail, ArrowRight, AlertCircle, ExternalLink, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailPreviewProps {
  invoice: InvoiceData;
  onSend: () => void;
  onCancel: () => void;
}

export default function EmailPreview({ invoice, onSend, onCancel }: EmailPreviewProps) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const paymentUrl = `${window.location.origin}/pay/${invoice.id}`;

  const handleSend = async () => {
    setIsSending(true);
    setError("");

    try {
      if (!isEmailConfigured()) {
        throw new Error("EmailJS is not configured. Check your .env file.");
      }

      await sendInvoiceEmail(invoice);
      toast.success(`Email sent to ${invoice.clientEmail}!`);
      onSend();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      setError(msg);
      toast.error("Failed to send email");
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Send Invoice via Email</h2>
              <p className="text-xs text-gray-500 font-medium">
                {isEmailConfigured() ? "Real email will be sent" : "EmailJS not configured"}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Email Meta */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-2 text-sm">
          <div className="flex">
            <span className="w-16 font-medium text-gray-500">To:</span>
            <span className="font-semibold text-gray-900">{invoice.clientEmail || "[Client Email Missing]"}</span>
          </div>
          <div className="flex">
            <span className="w-16 font-medium text-gray-500">Subject:</span>
            <span className="font-semibold text-gray-900">LASBCA Payment Request - {invoice.invoiceNumber}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Email Body Preview */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          <div className="border border-gray-200 rounded-lg overflow-hidden font-sans">
            {/* Email header */}
            <div className="bg-[#003200] p-4 text-center">
              <img src="/lasbca-logo.png" alt="LASBCA" className="w-12 h-12 mx-auto mb-2 drop-shadow-md" />
              <h1 className="text-white font-bold text-lg leading-tight uppercase">Lagos State Building Control Agency</h1>
              <p className="text-green-200 text-xs font-medium">Official Billing System</p>
            </div>
            
            {/* Email body */}
            <div className="p-6 bg-white space-y-5">
              <p className="text-gray-800">Dear <strong>{invoice.clientName}</strong>,</p>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                Please find attached your verified invoice <strong>{invoice.invoiceNumber}</strong> for the property located at <strong>{invoice.propertyAddress}</strong>.
              </p>
              
              {/* Amount box */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                  <span className="text-gray-500 text-sm">Total Amount Due</span>
                  <span className="text-xl font-black text-[#006400]">₦{formatNaira(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Due Date</span>
                  <span className="font-bold text-gray-800">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Pay button */}
              <div className="text-center pt-2">
                <a 
                  href={paymentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center justify-center bg-[#006400] text-white font-bold text-sm px-8 py-3 rounded-md hover:bg-[#005000] transition"
                  onClick={(e) => e.preventDefault()}
                >
                  Click Here To Pay Securely
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>

              {/* QR Code */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Or Scan QR Code to Pay</p>
                <div className="inline-block bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <QRCodeSVG value={paymentUrl} size={120} level="M" />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 break-all">{paymentUrl}</p>
              </div>
            </div>

            {/* Email footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This is an automated message from the LASBCA Billing System. Do not reply to this email.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-2xl">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            {isEmailConfigured() && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Email service connected</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="ghost" onClick={onCancel} disabled={isSending} className="flex-1 sm:flex-none">Cancel</Button>
            <Button 
              variant="default" 
              onClick={handleSend} 
              disabled={isSending || !invoice.clientEmail} 
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              {isSending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Send Email <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
