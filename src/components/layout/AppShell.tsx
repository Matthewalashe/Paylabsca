// ============================================================
// AppShell.tsx — Role-based sidebar layout
// ============================================================
// Sidebar: fixed, never scrolls with content
// Header: sticky to top of content area
// Footer: always visible at bottom of content area
// ============================================================

import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import ConfirmModal from "@/components/ui/confirm-modal";
import {
  LayoutDashboard, FileText, Plus, BookOpen, Settings, Menu, X, LogOut,
  Bell, ChevronRight, Shield, Users, ClipboardCheck, CheckCircle,
} from "lucide-react";

const BILLING_NAV = [
  { path: "/billing", label: "Dashboard", icon: LayoutDashboard },
  { path: "/invoices/new", label: "New Invoice", icon: Plus },
  { path: "/invoices", label: "My Invoices", icon: FileText },
  { path: "/revenue-codes", label: "Revenue Codes", icon: BookOpen },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

const CERT_NAV = [
  { path: "/certification", label: "Dashboard", icon: LayoutDashboard },
  { path: "/certification/pending", label: "Pending Review", icon: ClipboardCheck },
  { path: "/certification/approved", label: "Approved", icon: CheckCircle },
  { path: "/invoices", label: "All Invoices", icon: FileText },
  { path: "/certification/users", label: "User Management", icon: Users },
  { path: "/certification/settings", label: "Settings", icon: Settings },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/revenue-codes", label: "Revenue Codes", icon: BookOpen },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isCert = user.role === "certification_officer";
  const navItems = isCert ? CERT_NAV : BILLING_NAV;
  const roleLabel = isCert ? "Certification Officer" : "Billing Officer";
  const roleColor = isCert ? "bg-[#D4AF37]" : "bg-[#006400]";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Smart breadcrumb label
  const getBreadcrumb = () => {
    const match = navItems.find(i => location.pathname === i.path);
    if (match) return match.label;
    if (location.pathname.includes("/review/")) return "Review Invoice";
    if (location.pathname.includes("/edit")) return "Edit Invoice";
    if (location.pathname.includes("/invoices/") && location.pathname !== "/invoices") return "View Invoice";
    return "Page";
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR (Fixed, never scrolls with page) ===== */}
      <aside className={`fixed lg:relative top-0 left-0 z-50 h-screen w-[260px] flex-shrink-0 ${isCert ? "bg-[#1a1a2e]" : "bg-[#003200]"} flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img src="/lasbca-logo.png" alt="LASBCA" className="w-10 h-10 rounded-full shadow-lg" />
            <div>
              <h1 className="text-white font-bold text-sm tracking-wide leading-tight">LASBCA</h1>
              <p className={`text-[10px] font-medium ${isCert ? "text-amber-300" : "text-green-300"}`}>Billing & Payment System</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${roleColor} flex items-center justify-center text-white font-bold text-xs`}>
              {user.avatar || user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <p className="text-white text-sm font-semibold truncate max-w-[150px]">{user.name}</p>
              <div className="flex items-center gap-1.5">
                {isCert ? <Shield className="w-3 h-3 text-amber-400" /> : <ClipboardCheck className="w-3 h-3 text-green-400" />}
                <p className={`text-[11px] ${isCert ? "text-amber-300" : "text-green-300"}`}>{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation (scrollable if many items) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isNotif = item.path === "/notifications";

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-gray-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? (isCert ? "text-amber-400" : "text-green-400") : "text-gray-400 group-hover:text-gray-200"}`} />
                <span className="flex-1">{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — Sign Out */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/8 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top header bar (sticky) */}
        <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden lg:flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-900">{roleLabel}</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-gray-500">{getBreadcrumb()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] h-[18px]">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <div className={`w-8 h-8 rounded-full ${roleColor} flex items-center justify-center text-white text-xs font-bold`}>
                {user.avatar || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          {children}

          {/* ===== FOOTER (inside scrollable area, at bottom of content) ===== */}
          <footer className="bg-white border-t border-gray-200 mt-auto no-print">
            <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <img src="/lasbca-logo.png" alt="" className="w-5 h-5 rounded-full opacity-60" />
                <span>LASBCA Automated Billing System</span>
              </div>
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Lagos State Government. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* Sign out confirm */}
      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { setShowLogoutConfirm(false); handleLogout(); }}
        title="Sign Out?"
        message="Are you sure you want to sign out of the LASBCA Billing System? Any unsaved changes will be lost."
        confirmText="Sign Out"
        variant="danger"
      />
    </div>
  );
}
