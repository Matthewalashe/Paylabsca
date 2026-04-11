// ============================================================
// auth.tsx — Credential-based authentication context
// ============================================================
// Users sign in with email + password credentials.
// Demo users have preset passwords for ease of testing.
// Persists to localStorage for session continuity.
// ============================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "billing_officer" | "certification_officer";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  oracleNumber: string;
  role: UserRole;
  department: string;
  avatar?: string;
}

/** Internal type — user + password for credential matching */
interface UserCredentials extends AppUser {
  password: string;
}

// All user accounts with credentials
const USER_CREDENTIALS: UserCredentials[] = [
  {
    id: "co-001",
    name: "Arc. Bolatito Mustapha",
    email: "b.mustapha@lasbca.lg.gov.ng",
    password: "Certify@2026",
    phone: "+2348098765432",
    oracleNumber: "ORC-2024-0100",
    role: "certification_officer",
    department: "Building Certification Department",
    avatar: "BM",
  },
  {
    id: "bo-001",
    name: "Adeyemi Ogunlade",
    email: "a.ogunlade@lasbca.lg.gov.ng",
    password: "Billing@2026",
    phone: "+2348012345678",
    oracleNumber: "ORC-2024-0451",
    role: "billing_officer",
    department: "Building Certification Department",
    avatar: "AO",
  },
  {
    id: "bo-002",
    name: "Funke Adebayo",
    email: "f.adebayo@lasbca.lg.gov.ng",
    password: "Billing@2026",
    phone: "+2348055512345",
    oracleNumber: "ORC-2024-0452",
    role: "billing_officer",
    department: "Building Certification Department",
    avatar: "FA",
  },
  {
    id: "bo-003",
    name: "Chidi Nwosu",
    email: "c.nwosu@lasbca.lg.gov.ng",
    password: "Billing@2026",
    phone: "+2348033398765",
    oracleNumber: "ORC-2024-0453",
    role: "billing_officer",
    department: "Building Certification Department",
    avatar: "CN",
  },
];

// Public-facing user list (without passwords) for admin pages
export const ALL_USERS: AppUser[] = USER_CREDENTIALS.map(({ password, ...user }) => user);
export const DEMO_USERS: Record<UserRole, AppUser> = {
  billing_officer: ALL_USERS.find(u => u.role === "billing_officer")!,
  certification_officer: ALL_USERS.find(u => u.role === "certification_officer")!,
};

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
  login: (role: UserRole) => void; // kept for backward compat
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loginWithCredentials: () => ({ success: false, error: "Not initialized" }),
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem("lasbca_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("lasbca_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("lasbca_user");
    }
  }, [user]);

  const loginWithCredentials = (email: string, password: string): { success: boolean; error?: string } => {
    const trimEmail = email.trim().toLowerCase();
    const match = USER_CREDENTIALS.find(
      u => u.email.toLowerCase() === trimEmail && u.password === password
    );
    if (!match) {
      return { success: false, error: "Invalid email or password. Please try again." };
    }
    const { password: _, ...appUser } = match;
    setUser(appUser);
    return { success: true };
  };

  // Legacy role-based login (kept for any remaining usage)
  const login = (role: UserRole) => {
    setUser(DEMO_USERS[role]);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginWithCredentials, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth() {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    throw new Error("Not authenticated");
  }
  return auth as { user: AppUser; isAuthenticated: true; loginWithCredentials: AuthContextType["loginWithCredentials"]; login: (role: UserRole) => void; logout: () => void };
}
