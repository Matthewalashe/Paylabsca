// ============================================================
// InvoiceListPage.tsx — All invoices view
// ============================================================

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useInvoiceStore } from "@/lib/invoice-store";
import { formatNaira } from "@/lib/types";
import type { InvoiceStatus } from "@/lib/types";
import { Plus, Search, Eye, Calendar, FileText, Trash2, Pencil, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

function statusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; variant: "draft" | "pending" | "approved" | "sent" | "paid" | "overdue" | "rejected" | "default" }> = {
    draft: { label: "Draft", variant: "draft" },
    pending_approval: { label: "Pending", variant: "pending" },
    approved: { label: "Approved", variant: "approved" },
    sent: { label: "Sent", variant: "sent" },
    paid: { label: "Paid", variant: "paid" },
    overdue: { label: "Overdue", variant: "overdue" },
    rejected: { label: "Rejected", variant: "rejected" },
    cancelled: { label: "Cancelled", variant: "default" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function InvoiceListPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { invoices, deleteInvoice } = useInvoiceStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Artificial loading state for smoother UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = !search || inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete);
      toast.success("Invoice deleted successfully");
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">All Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} total invoices</p>
        </div>
        {user?.role === "billing_officer" && (
          <Link to="/invoices/new">
            <Button><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "draft", "pending_approval", "approved", "sent", "paid"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s
                ? "bg-[#006400] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All" : s === "pending_approval" ? "Pending" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search by client or invoice number..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Invoice list or loading skeletons */}
      <div className="grid gap-3">
        {isLoading ? (
          // Skeleton Loaders
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 ml-auto" />
                <div className="h-3 bg-gray-200 rounded w-16 ml-auto" />
              </div>
            </div>
          ))
        ) : filteredInvoices.length > 0 ? (
          // Actual Invoice Cards
          filteredInvoices.map(inv => (
            <div
              key={inv.id}
              className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md hover:border-green-200 transition-all duration-200 group"
            >
              <Link to={`/invoices/${inv.id}`} className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#006400]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                    {statusBadge(inv.status)}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{inv.clientName}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">{inv.propertyAddress}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-xs sm:text-base">₦{formatNaira(inv.totalAmount)}</p>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 mt-0.5 justify-end">
                    <Calendar className="w-3 h-3" />
                    {new Date(inv.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
                {/* View Receipt button for paid invoices */}
                {inv.status === "paid" && (
                  <button
                    onClick={(e) => { e.preventDefault(); navigate(`/invoices/${inv.id}`); }}
                    className="flex items-center gap-1 p-1.5 sm:p-2 text-[#006400] hover:bg-green-50 rounded-lg transition-colors"
                    title="View Receipt"
                  >
                    <Download className="w-4 h-4" /> <span className="text-[10px] sm:text-xs font-semibold">Receipt</span>
                  </button>
                )}
                {/* Edit + Delete for draft invoices (billing officers only) */}
                {user?.role === "billing_officer" && inv.status === "draft" && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); navigate(`/invoices/${inv.id}/edit`); }}
                      className="p-2 text-gray-400 hover:text-[#006400] hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit draft"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); setInvoiceToDelete(inv.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {/* Edit for rejected invoices (billing officers only) */}
                {user?.role === "billing_officer" && inv.status === "rejected" && (
                  <button
                    onClick={(e) => { e.preventDefault(); navigate(`/invoices/${inv.id}/edit`); }}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit & revise"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-semibold">No invoices found</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Invoice?"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Yes, Delete it"
        variant="danger"
      />
    </div>
  );
}
