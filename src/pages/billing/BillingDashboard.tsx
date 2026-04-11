// ============================================================
// BillingDashboard.tsx — Billing Officer's dashboard
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
  Plus, FileText, Clock, CheckCircle, Send, DollarSign,
  Eye, Calendar, ArrowUpRight, Bell, AlertCircle, XCircle,
} from "lucide-react";

function statusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; variant: "draft" | "pending" | "approved" | "sent" | "paid" | "overdue" | "rejected" | "default" }> = {
    draft: { label: "Draft", variant: "draft" },
    pending_approval: { label: "Pending Review", variant: "pending" },
    approved: { label: "Approved ✅", variant: "approved" },
    sent: { label: "Sent", variant: "sent" },
    paid: { label: "Paid", variant: "paid" },
    overdue: { label: "Overdue", variant: "overdue" },
    rejected: { label: "Needs Revision", variant: "rejected" },
    cancelled: { label: "Cancelled", variant: "default" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function BillingDashboard() {
  const { invoices } = useInvoiceStore();
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const myInvoices = invoices; // In production: filter by createdBy === user.id
  const recentNotifications = notifications.filter(n => !n.read).slice(0, 3);

  const stats = {
    total: myInvoices.length,
    drafts: myInvoices.filter(i => i.status === "draft").length,
    pending: myInvoices.filter(i => i.status === "pending_approval").length,
    approved: myInvoices.filter(i => i.status === "approved").length,
    rejected: myInvoices.filter(i => i.status === "rejected").length,
    sent: myInvoices.filter(i => i.status === "sent" || i.status === "paid").length,
    revenue: myInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0),
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Billing Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name?.split(" ")[0] || "Officer"}.</p>
        </div>
        <Link to="/invoices/new">
          <Button size="lg"><Plus className="w-4 h-4" /> Create New Invoice</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Invoices", value: stats.total, icon: FileText, color: "bg-blue-100 text-blue-600", change: `${stats.drafts} drafts` },
          { title: "Pending Review", value: stats.pending, icon: Clock, color: "bg-amber-100 text-amber-600", change: "Awaiting certification" },
          { title: "Approved", value: stats.approved, icon: CheckCircle, color: "bg-green-100 text-green-600", change: "Ready to send" },
          { title: "Needs Revision", value: stats.rejected, icon: XCircle, color: "bg-red-100 text-red-600", change: "Action required" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.color.split(" ")[0]} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color.split(" ")[1]}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.title}</p>
              <p className="text-xs text-gray-400 mt-1">{s.change}</p>
            </div>
          );
        })}
      </div>

      {/* Notifications + Quick Actions row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Notifications */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h3>
            <Link to="/notifications" className="text-xs text-[#006400] font-semibold hover:underline">View all</Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No new notifications</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    n.type === "approval" ? "bg-green-100" : n.type === "rejection" ? "bg-red-100" : "bg-blue-100"
                  }`}>
                    {n.type === "approval" ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                     n.type === "rejection" ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                     <Bell className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <Link to="/invoices/new" className="bg-gradient-to-br from-[#006400] to-[#004d00] rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
            <Plus className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="font-bold mb-1">Create New Invoice</h3>
            <p className="text-sm text-green-200">Start a new billing</p>
          </Link>
          <Link to="/invoices" className="bg-gradient-to-br from-[#D4AF37] to-[#b8962e] rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
            <FileText className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="font-bold mb-1">View My Invoices</h3>
            <p className="text-sm text-amber-100">Manage and track all billings</p>
          </Link>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Invoices</h2>
          <Link to="/invoices" className="text-xs text-[#006400] font-semibold hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {myInvoices.slice(0, 5).map(inv => (
            <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#006400]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                  {statusBadge(inv.status)}
                </div>
                <p className="text-sm text-gray-600 truncate">{inv.clientName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 text-sm">₦{formatNaira(inv.totalAmount)}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{new Date(inv.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              </div>
              <Eye className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
