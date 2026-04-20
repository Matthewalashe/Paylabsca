// ============================================================
// BillingDashboard.tsx — Clean billing dashboard
// ============================================================

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoiceStore } from "@/lib/invoice-store";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { formatNaira } from "@/lib/types";
import type { InvoiceStatus } from "@/lib/types";
import {
  Plus, FileText, Clock, CheckCircle, Send, 
  Eye, Calendar, ArrowRight, Bell, AlertCircle, XCircle,
} from "lucide-react";

function statusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; variant: "draft" | "pending" | "approved" | "sent" | "paid" | "overdue" | "rejected" | "default" }> = {
    draft: { label: "Draft", variant: "draft" },
    pending_approval: { label: "Pending", variant: "pending" },
    approved: { label: "Approved", variant: "approved" },
    sent: { label: "Sent", variant: "sent" },
    paid: { label: "Paid", variant: "paid" },
    overdue: { label: "Overdue", variant: "overdue" },
    rejected: { label: "Revision", variant: "rejected" },
    cancelled: { label: "Cancelled", variant: "default" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function BillingDashboard() {
  const { invoices } = useInvoiceStore();
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const myInvoices = invoices;
  const recentNotifs = notifications.filter(n => !n.read).slice(0, 3);

  const stats = {
    total: myInvoices.length,
    drafts: myInvoices.filter(i => i.status === "draft").length,
    pending: myInvoices.filter(i => i.status === "pending_approval").length,
    approved: myInvoices.filter(i => i.status === "approved").length,
    rejected: myInvoices.filter(i => i.status === "rejected").length,
  };

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            {stats.pending > 0 ? `${stats.pending} pending review` : "All caught up"}
          </p>
        </div>
        <Link to="/invoices/new">
          <Button className="bg-[#006400] hover:bg-[#005000] text-white rounded-lg h-9 text-[13px] px-3 sm:px-4 flex-shrink-0">
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Invoice</span><span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "#006400" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "#D4AF37" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "#16a34a" },
          { label: "Revision", value: stats.rejected, icon: XCircle, color: "#dc2626" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Two columns: Quick actions + Notifications */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          <Link to="/invoices/new" className="group bg-[#006400] rounded-xl p-4 sm:p-5 hover:bg-[#005000] transition-colors">
            <Plus className="w-5 h-5 text-white/70 mb-4 sm:mb-8" />
            <p className="text-white font-semibold text-[13px] sm:text-[14px]">Create Invoice</p>
            <ArrowRight className="w-3.5 h-3.5 text-white/40 mt-1 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/invoices" className="group bg-white rounded-xl p-4 sm:p-5 border border-gray-100 hover:border-gray-200 transition-colors">
            <FileText className="w-5 h-5 text-gray-300 mb-4 sm:mb-8" />
            <p className="text-gray-900 font-semibold text-[13px] sm:text-[14px]">View Invoices</p>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 mt-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold text-gray-900 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Notifications</span>
            <Link to="/notifications" className="text-[11px] text-[#006400] font-semibold hover:underline">All</Link>
          </div>
          {recentNotifs.length === 0 ? (
            <p className="text-[12px] text-gray-300 py-4 text-center">No new notifications</p>
          ) : (
            <div className="space-y-2">
              {recentNotifs.map(n => (
                <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === "approval" ? "bg-green-50" : n.type === "rejection" ? "bg-red-50" : "bg-blue-50"
                  }`}>
                    {n.type === "approval" ? <CheckCircle className="w-3 h-3 text-green-600" /> :
                     n.type === "rejection" ? <AlertCircle className="w-3 h-3 text-red-600" /> :
                     <Bell className="w-3 h-3 text-blue-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-900 truncate">{n.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      {myInvoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-900">Recent Invoices</span>
            <Link to="/invoices" className="text-[11px] text-[#006400] font-semibold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {myInvoices.slice(0, 5).map(inv => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-gray-900">{inv.invoiceNumber}</span>
                    {statusBadge(inv.status)}
                  </div>
                  <p className="text-[11px] sm:text-[12px] text-gray-400 truncate mt-0.5">{inv.clientName}</p>
                </div>
                <p className="font-semibold text-gray-900 text-[12px] sm:text-[13px] flex-shrink-0">₦{formatNaira(inv.totalAmount)}</p>
                <Eye className="w-3.5 h-3.5 text-gray-200 hidden sm:block" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
