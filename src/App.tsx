// ============================================================
// App.tsx — Root router with role-based route protection
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import BillingDashboard from "@/pages/billing/BillingDashboard";
import CertDashboard from "@/pages/certification/CertDashboard";
import InvoiceEditorPage from "@/pages/InvoiceEditorPage";
import InvoiceViewPage from "@/pages/InvoiceViewPage";
import InvoiceListPage from "@/pages/InvoiceListPage";
import RevenueCodesPage from "@/pages/RevenueCodesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import CertReviewPage from "@/pages/certification/CertReviewPage";
import UserManagementPage from "@/pages/certification/UserManagementPage";
import PendingReviewPage from "@/pages/certification/PendingReviewPage";
import ApprovedInvoicesPage from "@/pages/certification/ApprovedInvoicesPage";
import CertSettingsPage from "@/pages/certification/CertSettingsPage";
import FinancialRecordsPage from "@/pages/certification/FinancialRecordsPage";
import PaymentPage from "@/pages/PaymentPage";
import InvoicePublicPage from "@/pages/InvoicePublicPage";
import RevenueReceiptPage from "@/pages/RevenueReceiptPage";

// Context Providers
import { AuthProvider } from "@/lib/auth";
import { NotificationProvider } from "@/lib/notifications";
import { InvoiceStoreProvider } from "@/lib/invoice-store";

// Toast notifications
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <InvoiceStoreProvider>
          <BrowserRouter>
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Billing Officer Routes */}
              <Route path="/billing" element={
                <ProtectedRoute allowedRoles={["billing_officer"]}>
                  <AppShell><BillingDashboard /></AppShell>
                </ProtectedRoute>
              } />
              
              {/* Certification Officer Routes */}
              <Route path="/certification" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><CertDashboard /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/certification/review/:id" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><CertReviewPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/certification/users" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><UserManagementPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/certification/pending" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><PendingReviewPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/certification/approved" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><ApprovedInvoicesPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/certification/settings" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><CertSettingsPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/certification/financials" element={
                <ProtectedRoute allowedRoles={["certification_officer"]}>
                  <AppShell><FinancialRecordsPage /></AppShell>
                </ProtectedRoute>
              } />

              {/* Shared App Pages (both roles) */}
              <Route path="/invoices" element={
                <ProtectedRoute><AppShell><InvoiceListPage /></AppShell></ProtectedRoute>
              } />
              <Route path="/invoices/new" element={
                <ProtectedRoute allowedRoles={["billing_officer"]}>
                  <AppShell><InvoiceEditorPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/invoices/:id" element={
                <ProtectedRoute><AppShell><InvoiceViewPage /></AppShell></ProtectedRoute>
              } />
              <Route path="/invoices/:id/edit" element={
                <ProtectedRoute allowedRoles={["billing_officer"]}>
                  <AppShell><InvoiceEditorPage /></AppShell>
                </ProtectedRoute>
              } />
              <Route path="/revenue-codes" element={
                <ProtectedRoute><AppShell><RevenueCodesPage /></AppShell></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute><AppShell><NotificationsPage /></AppShell></ProtectedRoute>
              } />
              
              {/* Public Payment Gateway */}
              <Route path="/pay/:invoiceId" element={<PaymentPage />} />
              
              {/* Public Invoice View / Download (from WhatsApp/Email links) */}
              <Route path="/invoice/:invoiceId" element={<InvoicePublicPage />} />
              
              {/* Public Revenue Receipt (LIRS format) */}
              <Route path="/receipt/:receiptId" element={<RevenueReceiptPage />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: { fontFamily: "'Inter', system-ui, sans-serif" },
              duration: 4000,
            }}
          />
        </InvoiceStoreProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
