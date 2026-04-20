// ============================================================
// FinancialRecordsPage.tsx — Financial dashboard for Cert Officer
// ============================================================
// Shows paid invoices, revenue stats, payment history, and
// a visual revenue performance chart (pure CSS/HTML).
// ============================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInvoiceStore } from "@/lib/invoice-store";
import { formatNaira } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, TrendingUp, DollarSign, FileText, Calendar,
  CheckCircle, Clock, BarChart3, Search, ChevronDown, ChevronUp,
  Eye, Download, Filter,
} from "lucide-react";

type FilterTab = "all" | "paid" | "sent" | "approved";
type SortField = "date" | "amount" | "client";
type SortDir = "asc" | "desc";

export default function FinancialRecordsPage() {
  const { invoices } = useInvoiceStore();
  
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ===== DERIVED DATA =====
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const sentInvoices = invoices.filter(i => i.status === "sent");
  const approvedInvoices = invoices.filter(i => i.status === "approved");
  
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingRevenue = sentInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const approvedRevenue = approvedInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalInvoiceValue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  // Monthly revenue breakdown for chart (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      
      const monthPaid = paidInvoices.filter(inv => {
        const paidDate = new Date(inv.paidAt || inv.updatedAt);
        return paidDate >= monthStart && paidDate <= monthEnd;
      });
      
      months.push({
        label: monthLabel,
        revenue: monthPaid.reduce((s, inv) => s + inv.totalAmount, 0),
        count: monthPaid.length,
      });
    }
    return months;
  }, [paidInvoices]);

  const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  // Recent payments (sorted by paidAt)
  const recentPayments = useMemo(() => {
    return [...paidInvoices]
      .sort((a, b) => new Date(b.paidAt || b.updatedAt).getTime() - new Date(a.paidAt || a.updatedAt).getTime())
      .slice(0, 5);
  }, [paidInvoices]);

  // Filtered and sorted full table
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];

    // Filter by tab
    if (activeTab === "paid") list = list.filter(i => i.status === "paid");
    else if (activeTab === "sent") list = list.filter(i => i.status === "sent");
    else if (activeTab === "approved") list = list.filter(i => i.status === "approved");
    else list = list.filter(i => ["paid", "sent", "approved"].includes(i.status));

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.clientName.toLowerCase().includes(q) ||
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.propertyAddress.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(a.paidAt || a.updatedAt).getTime() - new Date(b.paidAt || b.updatedAt).getTime();
      } else if (sortField === "amount") {
        cmp = a.totalAmount - b.totalAmount;
      } else if (sortField === "client") {
        cmp = a.clientName.localeCompare(b.clientName);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [invoices, activeTab, searchQuery, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 text-[#D4AF37]" />
      : <ChevronUp className="w-3 h-3 text-[#D4AF37]" />;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/certification" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">Financial Records</h1>
            <p className="text-sm text-gray-500">Revenue analytics, payment history & financial overview</p>
          </div>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: `₦${formatNaira(totalRevenue)}`,
            sub: `${paidInvoices.length} paid invoices`,
            icon: DollarSign,
            color: "#006400",
            bg: "bg-green-50",
          },
          {
            label: "Awaiting Payment",
            value: `₦${formatNaira(pendingRevenue)}`,
            sub: `${sentInvoices.length} sent invoices`,
            icon: Clock,
            color: "#D4AF37",
            bg: "bg-amber-50",
          },
          {
            label: "Ready to Send",
            value: `₦${formatNaira(approvedRevenue)}`,
            sub: `${approvedInvoices.length} approved`,
            icon: CheckCircle,
            color: "#16a34a",
            bg: "bg-green-50",
          },
          {
            label: "Total Invoice Value",
            value: `₦${formatNaira(totalInvoiceValue)}`,
            sub: `${invoices.length} total invoices`,
            icon: BarChart3,
            color: "#1a1a2e",
            bg: "bg-gray-50",
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} rounded-xl border border-gray-100 p-4 sm:p-5 transition-shadow hover:shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white shadow-sm">
                  <Icon className="w-4.5 h-4.5" style={{ color: card.color }} strokeWidth={1.8} />
                </div>
                <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-bold">{card.label}</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">{card.value}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ===== REVENUE CHART + RECENT PAYMENTS ===== */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#006400]" />
              <h3 className="font-bold text-gray-900 text-sm">Revenue Performance</h3>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Last 6 Months</span>
          </div>
          
          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 sm:gap-3 h-[180px] sm:h-[200px]">
            {monthlyData.map((month, idx) => {
              const heightPct = maxMonthlyRevenue > 0 ? (month.revenue / maxMonthlyRevenue) * 100 : 0;
              const isLast = idx === monthlyData.length - 1;
              return (
                <div key={month.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  {/* Value label */}
                  <span className={`text-[9px] sm:text-[10px] font-bold truncate max-w-full ${isLast ? "text-[#006400]" : "text-gray-400"}`}>
                    {month.revenue > 0 ? `₦${formatNaira(month.revenue)}` : "—"}
                  </span>
                  {/* Bar */}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isLast
                          ? "bg-gradient-to-t from-[#006400] to-[#00a000]"
                          : "bg-gradient-to-t from-gray-200 to-gray-300"
                      }`}
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        minHeight: "4px",
                      }}
                    />
                  </div>
                  {/* Month label */}
                  <span className="text-[10px] font-semibold text-gray-500">{month.label}</span>
                  {/* Count */}
                  <span className="text-[9px] text-gray-300">{month.count} paid</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 text-sm">Recent Payments</h3>
            </div>
          </div>
          
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <DollarSign className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.map(inv => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate">{inv.clientName}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {inv.invoiceNumber} • {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold text-green-700">₦{formatNaira(inv.totalAmount)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== COLLECTION RATE SUMMARY ===== */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl p-5 sm:p-6 text-white">
        <div className="flex flex-wrap gap-6 sm:gap-10 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Collection Rate</p>
            <p className="text-3xl sm:text-4xl font-black text-[#D4AF37] mt-1">
              {totalInvoiceValue > 0 ? `${Math.round((totalRevenue / totalInvoiceValue) * 100)}%` : "0%"}
            </p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
              <span>Collected</span>
              <span>₦{formatNaira(totalRevenue)} / ₦{formatNaira(totalInvoiceValue)}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-full transition-all duration-700"
                style={{ width: `${totalInvoiceValue > 0 ? (totalRevenue / totalInvoiceValue) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Paid</p>
              <p className="text-lg font-bold text-green-400">{paidInvoices.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Sent</p>
              <p className="text-lg font-bold text-blue-400">{sentInvoices.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Approved</p>
              <p className="text-lg font-bold text-amber-400">{approvedInvoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FULL PAYMENT HISTORY TABLE ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="font-bold text-gray-900 text-sm">Payment History</h3>
              <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 rounded-full px-2 py-0.5">
                {filteredInvoices.length} records
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[200px] h-8 pl-8 pr-3 text-[12px] border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mt-3">
            {([
              { id: "all" as FilterTab, label: "All Records" },
              { id: "paid" as FilterTab, label: "Paid" },
              { id: "sent" as FilterTab, label: "Sent (Pending)" },
              { id: "approved" as FilterTab, label: "Approved" },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Filter className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-semibold text-gray-400">No records found</p>
            <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Invoice</th>
                    <th
                      className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("client")}
                    >
                      <span className="flex items-center gap-1">Client <SortIcon field="client" /></span>
                    </th>
                    <th
                      className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("amount")}
                    >
                      <span className="flex items-center justify-end gap-1">Amount <SortIcon field="amount" /></span>
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th
                      className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort("date")}
                    >
                      <span className="flex items-center justify-end gap-1">Date <SortIcon field="date" /></span>
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-gray-900">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">{inv.clientName}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{inv.propertyAddress}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">₦{formatNaira(inv.totalAmount)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          inv.status === "paid" ? "paid" :
                          inv.status === "sent" ? "sent" :
                          inv.status === "approved" ? "approved" : "default"
                        }>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {new Date(inv.paidAt || inv.updatedAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-[#006400] bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filteredInvoices.map(inv => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    inv.status === "paid" ? "bg-green-50" : inv.status === "sent" ? "bg-blue-50" : "bg-amber-50"
                  }`}>
                    {inv.status === "paid"
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : inv.status === "sent"
                      ? <Clock className="w-4 h-4 text-blue-500" />
                      : <FileText className="w-4 h-4 text-amber-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate">{inv.clientName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{inv.invoiceNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-bold text-gray-900">₦{formatNaira(inv.totalAmount)}</p>
                    <Badge variant={inv.status === "paid" ? "paid" : inv.status === "sent" ? "sent" : "approved"}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
