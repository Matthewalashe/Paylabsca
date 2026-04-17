// ============================================================
// CertDashboard.tsx — Clean certification dashboard
// ============================================================

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoiceStore } from "@/lib/invoice-store";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/types";
import {
  FileText, Clock, CheckCircle, XCircle, Users,
  Eye, ArrowRight, AlertTriangle, BarChart3, Settings,
} from "lucide-react";

export default function CertDashboard() {
  const { invoices } = useInvoiceStore();
  const { user } = useAuth();

  const pending = invoices.filter(i => i.status === "pending_approval");
  const approved = invoices.filter(i => i.status === "approved" || i.status === "sent" || i.status === "paid");
  const rejected = invoices.filter(i => i.status === "rejected");
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {pending.length > 0
              ? <span className="text-[#D4AF37] font-medium">{pending.length} invoice{pending.length > 1 ? "s" : ""} awaiting review</span>
              : "No pending reviews"
            }
          </p>
        </div>
        <Link to="/certification/users">
          <Button variant="outline" className="h-9 text-[13px] rounded-lg border-gray-200">
            <Users className="w-3.5 h-3.5" /> Users
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: pending.length, icon: Clock, color: "#D4AF37", urgent: pending.length > 0 },
          { label: "Approved", value: approved.length, icon: CheckCircle, color: "#16a34a", urgent: false },
          { label: "Rejected", value: rejected.length, icon: XCircle, color: "#dc2626", urgent: false },
          { label: "Revenue", value: `₦${formatNaira(totalRevenue)}`, icon: BarChart3, color: "#006400", urgent: false },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white rounded-xl border ${s.urgent ? "border-[#D4AF37]/30" : "border-gray-100"} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
              {s.urgent && <div className="w-full h-0.5 bg-[#D4AF37]/20 rounded-full mt-3"><div className="h-full bg-[#D4AF37] rounded-full animate-pulse" style={{ width: "60%" }} /></div>}
            </div>
          );
        })}
      </div>

      {/* Pending Review — Priority */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D4AF37]/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[12px] font-semibold text-gray-900">Awaiting Review</span>
          </div>
          <div className="space-y-1.5">
            {pending.map(inv => (
              <Link
                key={inv.id}
                to={`/certification/review/${inv.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[11px] font-bold text-gray-900">{inv.invoiceNumber}</span>
                  <p className="text-[11px] text-gray-400 truncate">{inv.clientName}</p>
                </div>
                <p className="font-semibold text-gray-900 text-[13px]">₦{formatNaira(inv.totalAmount)}</p>
                <Button size="sm" className="h-7 text-[11px] rounded-lg bg-[#D4AF37] hover:bg-[#c9a430] text-white opacity-0 group-hover:opacity-100 transition-opacity">Review</Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/certification/pending" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#D4AF37]/30 transition-colors">
          <Clock className="w-5 h-5 text-[#D4AF37] mb-6" strokeWidth={1.5} />
          <p className="text-gray-900 font-semibold text-[13px]">Pending</p>
          <p className="text-[11px] text-gray-400">{pending.length} waiting</p>
        </Link>
        <Link to="/certification/approved" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-green-200 transition-colors">
          <CheckCircle className="w-5 h-5 text-green-500 mb-6" strokeWidth={1.5} />
          <p className="text-gray-900 font-semibold text-[13px]">Approved</p>
          <p className="text-[11px] text-gray-400">{approved.length} total</p>
        </Link>
        <Link to="/certification/users" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
          <Users className="w-5 h-5 text-gray-400 mb-6" strokeWidth={1.5} />
          <p className="text-gray-900 font-semibold text-[13px]">Users</p>
          <p className="text-[11px] text-gray-400">Manage access</p>
        </Link>
      </div>

      {/* All Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-900">All Invoices</span>
            <Link to="/invoices" className="text-[11px] text-[#006400] font-semibold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.slice(0, 5).map(inv => (
              <Link
                key={inv.id}
                to={inv.status === "pending_approval" ? `/certification/review/${inv.id}` : `/invoices/${inv.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-gray-900">{inv.invoiceNumber}</span>
                    <Badge variant={
                      inv.status === "draft" ? "draft" : inv.status === "pending_approval" ? "pending" :
                      inv.status === "approved" ? "approved" : inv.status === "paid" ? "paid" :
                      inv.status === "rejected" ? "rejected" : "sent"
                    }>
                      {inv.status === "pending_approval" ? "Pending" : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-gray-400 truncate mt-0.5">{inv.clientName}</p>
                </div>
                <p className="font-semibold text-gray-900 text-[13px]">₦{formatNaira(inv.totalAmount)}</p>
                <Eye className="w-3.5 h-3.5 text-gray-200" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
