// ============================================================
// ApprovedInvoicesPage.tsx — Invoices approved by Cert Officer
// ============================================================

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useInvoiceStore } from "@/lib/invoice-store";
import { formatNaira } from "@/lib/types";
import { CheckCircle, FileText, Eye, Calendar } from "lucide-react";

export default function ApprovedInvoicesPage() {
  const { invoices } = useInvoiceStore();
  const approved = invoices.filter(i => ["approved", "sent", "paid"].includes(i.status));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Approved Invoices</h1>
        <p className="text-sm text-gray-500 mt-0.5">{approved.length} invoices certified and approved</p>
      </div>

      {approved.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-lg">No approved invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approved.map(inv => (
            <Link
              key={inv.id}
              to={`/invoices/${inv.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-200 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                <p className="text-sm font-medium text-gray-700 truncate">{inv.clientName}</p>
              </div>
              <Badge variant={inv.status === "paid" ? "paid" : inv.status === "sent" ? "sent" : "approved"}>
                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
              </Badge>
              <p className="font-bold text-gray-900">₦{formatNaira(inv.totalAmount)}</p>
              <Eye className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
