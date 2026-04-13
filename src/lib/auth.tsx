// ============================================================
// auth.tsx — Dynamic credential-based auth with user management
// ============================================================
// Users sign in with email + password.
// Certification Officers can create, edit, reset passwords.
// User registry persists in localStorage.
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
export interface UserCredentials extends AppUser {
  password: string;
  createdAt: string;
  status: "active" | "suspended";
}

// Default seed users (only used on first load)
const DEFAULT_CREDENTIALS: UserCredentials[] = [
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
    createdAt: "2026-01-01T00:00:00Z",
    status: "active",
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
    createdAt: "2026-01-15T00:00:00Z",
    status: "active",
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
    createdAt: "2026-02-01T00:00:00Z",
    status: "active",
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
    createdAt: "2026-02-15T00:00:00Z",
    status: "active",
  },
];

const STORAGE_KEY = "lasbca_user_registry";

/** Load user registry from localStorage or seed from defaults */
function loadUserRegistry(): UserCredentials[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  // First time — seed with defaults
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
  return [...DEFAULT_CREDENTIALS];
}

function saveUserRegistry(users: UserCredentials[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Strip passwords for public consumption
function toAppUser(cred: UserCredentials): AppUser {
  const { password, createdAt, status, ...user } = cred;
  return user;
}

// ============================================================
// Context
// ============================================================

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
  login: (role: UserRole) => void;
  logout: () => void;
  // User management (for Certification Officers)
  getAllUsers: () => (AppUser & { status: string; createdAt: string })[];
  createUser: (data: { name: string; email: string; phone: string; oracleNumber: string; role: UserRole; password: string; department?: string }) => { success: boolean; error?: string };
  deleteUser: (id: string) => boolean;
  updateUserRole: (id: string, role: UserRole) => boolean;
  resetPassword: (id: string, newPassword: string) => boolean;
  suspendUser: (id: string) => boolean;
  activateUser: (id: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loginWithCredentials: () => ({ success: false }),
  login: () => {},
  logout: () => {},
  getAllUsers: () => [],
  createUser: () => ({ success: false }),
  deleteUser: () => false,
  updateUserRole: () => false,
  resetPassword: () => false,
  suspendUser: () => false,
  activateUser: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem("lasbca_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Force-initialize registry on mount
  const [registry, setRegistry] = useState<UserCredentials[]>(loadUserRegistry);

  useEffect(() => {
    if (user) {
      localStorage.setItem("lasbca_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("lasbca_user");
    }
  }, [user]);

  useEffect(() => {
    saveUserRegistry(registry);
  }, [registry]);

  const loginWithCredentials = (email: string, password: string) => {
    const trimEmail = email.trim().toLowerCase();
    const match = registry.find(
      u => u.email.toLowerCase() === trimEmail && u.password === password
    );
    if (!match) return { success: false, error: "Invalid email or password." };
    if (match.status === "suspended") return { success: false, error: "Account suspended. Contact your administrator." };
    setUser(toAppUser(match));
    return { success: true };
  };

  const login = (role: UserRole) => {
    const match = registry.find(u => u.role === role && u.status === "active");
    if (match) setUser(toAppUser(match));
  };

  const logout = () => setUser(null);

  // ---- User Management ----
  const getAllUsers = () => registry.map(u => ({
    ...toAppUser(u),
    status: u.status,
    createdAt: u.createdAt,
  }));

  const createUser = (data: { name: string; email: string; phone: string; oracleNumber: string; role: UserRole; password: string; department?: string }) => {
    if (registry.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "A user with this email already exists." };
    }
    const newUser: UserCredentials = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      oracleNumber: data.oracleNumber.trim(),
      role: data.role,
      department: data.department || "Building Certification Department",
      avatar: data.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
      password: data.password,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    setRegistry(prev => [...prev, newUser]);
    return { success: true };
  };

  const deleteUser = (id: string) => {
    if (id === "co-001") return false; // Can't delete primary admin
    setRegistry(prev => prev.filter(u => u.id !== id));
    return true;
  };

  const updateUserRole = (id: string, role: UserRole) => {
    if (id === "co-001") return false;
    setRegistry(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    return true;
  };

  const resetPassword = (id: string, newPassword: string) => {
    setRegistry(prev => prev.map(u => u.id === id ? { ...u, password: newPassword } : u));
    return true;
  };

  const suspendUser = (id: string) => {
    if (id === "co-001") return false;
    setRegistry(prev => prev.map(u => u.id === id ? { ...u, status: "suspended" as const } : u));
    return true;
  };

  const activateUser = (id: string) => {
    setRegistry(prev => prev.map(u => u.id === id ? { ...u, status: "active" as const } : u));
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, loginWithCredentials, login, logout,
      getAllUsers, createUser, deleteUser, updateUserRole, resetPassword, suspendUser, activateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Public user list helper (for backward compatibility)
export const ALL_USERS: AppUser[] = DEFAULT_CREDENTIALS.map(u => toAppUser(u));
export const DEMO_USERS: Record<UserRole, AppUser> = {
  billing_officer: ALL_USERS.find(u => u.role === "billing_officer")!,
  certification_officer: ALL_USERS.find(u => u.role === "certification_officer")!,
};
