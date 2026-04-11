// ============================================================
// PendingReviewPage.tsx — Invoices pending certification
// ============================================================

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInvoiceStore } from "@/lib/invoice-store";
import { formatNaira } from "@/lib/types";
import { Clock, FileText, Eye, Calendar } from "lucide-react";

export default function PendingReviewPage() {
  const { invoices } = useInvoiceStore();
  const pending = invoices.filter(i => i.status === "pending_approval");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pending Review</h1>
        <p className="text-sm text-gray-500 mt-0.5">{pending.length} invoice(s) awaiting your certification</p>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-lg">No pending invoices</p>
          <p className="text-sm mt-1">All invoices have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(inv => (
            <Link
              key={inv.id}
              to={`/certification/review/${inv.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-amber-200 p-4 hover:shadow-md hover:border-amber-300 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                <p className="text-sm font-medium text-gray-700 truncate">{inv.clientName}</p>
                <p className="text-xs text-gray-500 truncate">{inv.propertyAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₦{formatNaira(inv.totalAmount)}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(inv.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </div>
              <Button size="sm" variant="gold">Review</Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
