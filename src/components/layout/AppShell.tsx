// ============================================================
// AppShell.tsx — Refined minimal sidebar layout
// ============================================================

import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import ConfirmModal from "@/components/ui/confirm-modal";
import {
  LayoutDashboard, FileText, Plus, BookOpen, Settings, Menu, X, LogOut,
  Bell, Shield, Users, ClipboardCheck, CheckCircle,
} from "lucide-react";

const BILLING_NAV = [
  { path: "/billing", label: "Dashboard", icon: LayoutDashboard },
  { path: "/invoices/new", label: "New Invoice", icon: Plus },
  { path: "/invoices", label: "Invoices", icon: FileText },
  { path: "/revenue-codes", label: "Revenue Codes", icon: BookOpen },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

const CERT_NAV = [
  { path: "/certification", label: "Dashboard", icon: LayoutDashboard },
  { path: "/certification/pending", label: "Pending", icon: ClipboardCheck },
  { path: "/certification/approved", label: "Approved", icon: CheckCircle },
  { path: "/invoices", label: "All Invoices", icon: FileText },
  { path: "/certification/users", label: "Users", icon: Users },
  { path: "/certification/settings", label: "Settings", icon: Settings },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const isCert = user.role === "certification_officer";
  const navItems = isCert ? CERT_NAV : BILLING_NAV;
  const accent = isCert ? "#D4AF37" : "#006400";

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="h-screen flex overflow-hidden bg-[#F7F7F8]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed lg:relative top-0 left-0 z-50 h-screen w-[240px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Logo */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/lasbca-logo.png" alt="" className="w-7 h-7 rounded-full" />
            <span className="font-bold text-[13px] text-gray-900 tracking-wide">LASBCA</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isNotif = item.path === "/notifications";

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-[16px] h-[16px]" strokeWidth={isActive ? 2 : 1.5} />
                <span className="flex-1">{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] h-[18px]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User + Sign Out */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: accent }}>
              {user.avatar || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{isCert ? "Certification" : "Billing"}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex-shrink-0 z-30 flex items-center px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-50 mr-3">
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="w-4.5 h-4.5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
          <footer className="py-6 px-6 text-center">
            <p className="text-[11px] text-gray-300">© {new Date().getFullYear()} LASBCA • Lagos State Government</p>
          </footer>
        </main>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { setShowLogoutConfirm(false); handleLogout(); }}
        title="Sign Out?"
        message="You will need to sign in again to access the portal."
        confirmText="Sign Out"
        variant="danger"
      />
    </div>
  );
}
