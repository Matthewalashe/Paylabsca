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
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const dashboardPath = user.role === "certification_officer" ? "/certification" : "/billing";
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
