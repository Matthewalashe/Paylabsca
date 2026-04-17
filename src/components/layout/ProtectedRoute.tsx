// ============================================================
// ProtectedRoute.tsx — Role-based route guard
// ============================================================

import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Wait for auth state to resolve before redirecting
  // This prevents flash-redirects when refreshing an authenticated page
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#006400] rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const dashboardPath = user.role === "certification_officer" ? "/certification" : "/billing";
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
