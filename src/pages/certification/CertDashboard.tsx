// ============================================================
// CertDashboard.tsx — Certification Officer Dashboard
// ============================================================

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoiceStore } from "@/lib/invoice-store";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/types";
import {
  Shield, FileText, Clock, CheckCircle, XCircle, Users,
  Eye, Calendar, ArrowUpRight, AlertTriangle, BarChart3,
} from "lucide-react";

export default function CertDashboard() {
  const { invoices } = useInvoiceStore();
  const { user } = useAuth();

  const pending = invoices.filter(i => i.status === "pending_approval");
  const approved = invoices.filter(i => i.status === "approved" || i.status === "sent" || i.status === "paid");
  const rejected = invoices.filter(i => i.status === "rejected");
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Certification Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome, {user?.name || "Officer"}.{" "}
            {pending.length > 0 && <span className="text-amber-600 font-semibold">{pending.length} invoice(s) awaiting your review.</span>}
          </p>
        </div>
        <Link to="/certification/users">
          <Button variant="outline"><Users className="w-4 h-4" /> Manage Users</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Pending Review", value: pending.length, icon: Clock, bg: "bg-amber-100", color: "text-amber-600", urgent: pending.length > 0 },
          { title: "Approved", value: approved.length, icon: CheckCircle, bg: "bg-green-100", color: "text-green-600", urgent: false },
          { title: "Rejected", value: rejected.length, icon: XCircle, bg: "bg-red-100", color: "text-red-600", urgent: false },
          { title: "Revenue Collected", value: `₦${formatNaira(totalRevenue)}`, icon: BarChart3, bg: "bg-purple-100", color: "text-purple-600", urgent: false },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className={`bg-white rounded-xl border ${s.urgent ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-200"} p-5 hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                {s.urgent && <span className="animate-pulse w-3 h-3 rounded-full bg-amber-400" />}
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.title}</p>
            </div>
          );
        })}
      </div>

      {/* Pending Review — Highlighted */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-amber-800">Invoices Awaiting Your Review</h2>
          </div>
          <div className="space-y-2">
            {pending.map(inv => (
              <Link
                key={inv.id}
                to={`/certification/review/${inv.id}`}
                className="flex items-center gap-4 bg-white rounded-lg p-3 border border-amber-100 hover:shadow-md hover:border-amber-300 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                  <p className="text-sm text-gray-600 truncate">{inv.clientName} — {inv.propertyAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₦{formatNaira(inv.totalAmount)}</p>
                </div>
                <Button size="sm" variant="gold">Review</Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/certification/pending" className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <Clock className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="font-bold mb-1">Pending Reviews</h3>
          <p className="text-sm text-amber-100">{pending.length} invoice(s) waiting</p>
        </Link>
        <Link to="/certification/approved" className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="font-bold mb-1">Approved Invoices</h3>
          <p className="text-sm text-green-200">{approved.length} approved</p>
        </Link>
        <Link to="/certification/users" className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <Users className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="font-bold mb-1">User Management</h3>
          <p className="text-sm text-gray-300">Create, edit, and manage users</p>
        </Link>
      </div>

      {/* All Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">All Invoices</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {invoices.slice(0, 6).map(inv => (
            <Link key={inv.id} to={inv.status === "pending_approval" ? `/certification/review/${inv.id}` : `/invoices/${inv.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
              <div className={`w-9 h-9 rounded-lg ${inv.status === "pending_approval" ? "bg-amber-50" : "bg-green-50"} flex items-center justify-center`}>
                <FileText className={`w-4 h-4 ${inv.status === "pending_approval" ? "text-amber-600" : "text-green-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                <p className="text-sm text-gray-600 truncate">{inv.clientName}</p>
              </div>
              <Badge variant={
                inv.status === "draft" ? "draft" : inv.status === "pending_approval" ? "pending" :
                inv.status === "approved" ? "approved" : inv.status === "paid" ? "paid" :
                inv.status === "rejected" ? "rejected" : "sent"
              }>
                {inv.status === "pending_approval" ? "Pending" : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
              </Badge>
              <p className="font-bold text-gray-900 text-sm">₦{formatNaira(inv.totalAmount)}</p>
              <Eye className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
