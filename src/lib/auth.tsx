// ============================================================
// auth.tsx — Supabase-backed authentication
// ============================================================
// Real JWT sessions via Supabase Auth.
// Supabase auto-confirms users (via DB trigger) so signIn works
// immediately. Email verification is handled separately via our
// own token + EmailJS system.
// ============================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase, createIsolatedClient, callEdgeFunction } from "./supabase";
import { sendVerificationEmail } from "./email-service";

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
  emailVerified: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (role: UserRole) => void;
  logout: () => void;
  // User management
  getAllUsers: () => Promise<(AppUser & { status: string; createdAt: string })[]>;
  createUser: (data: { name: string; email: string; phone: string; oracleNumber: string; role: UserRole; password: string; department?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<boolean>;
  updateUserRole: (id: string, role: UserRole) => Promise<boolean>;
  resetPassword: (id: string, newPassword: string) => Promise<boolean>;
  suspendUser: (id: string) => Promise<boolean>;
  activateUser: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  loginWithCredentials: async () => ({ success: false }),
  login: () => {},
  logout: () => {},
  getAllUsers: async () => [],
  createUser: async () => ({ success: false }),
  deleteUser: async () => false,
  updateUserRole: async () => false,
  resetPassword: async () => false,
  suspendUser: async () => false,
  activateUser: async () => false,
});

/** Convert DB profile row to AppUser */
function toAppUser(profile: any): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone || "",
    oracleNumber: profile.oracle_number || "",
    role: profile.role as UserRole,
    department: profile.department || "Building Certification Department",
    avatar: profile.avatar || profile.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    emailVerified: profile.email_verified ?? true, // default true for legacy rows
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes — defer profile loading to avoid lock contention
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Defer to avoid blocking the auth lock
        setTimeout(() => loadProfile(session.user.id), 0);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setUser(toAppUser(data));
    } else {
      console.error("Failed to load profile:", error);
      setUser(null);
    }
  }

  const loginWithCredentials = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, error: error.message === "Invalid login credentials"
        ? "Invalid email or password."
        : error.message };
    }

    if (data.user) {
      // Check if profile is suspended
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single();

      if (profile?.status === "suspended") {
        await supabase.auth.signOut();
        return { success: false, error: "Account suspended. Contact your administrator." };
      }

      await loadProfile(data.user.id);
    }

    return { success: true };
  };

  const login = (_role: UserRole) => {
    // Legacy — no-op with Supabase auth
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // ---- User Management ----

  const getAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map((p: any) => ({
      ...toAppUser(p),
      status: p.status || "active",
      createdAt: p.created_at,
    }));
  };

  const createUser = async (userData: {
    name: string; email: string; phone: string;
    oracleNumber: string; role: UserRole; password: string; department?: string;
  }) => {
    try {
      // Use isolated client so we don't log out the current cert officer
      const isolatedClient = createIsolatedClient();

      // 1. Create auth user via signUp
      // DB trigger auto-confirms the user so they can sign in immediately.
      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || "Failed to create auth account." };
      }

      // 2. Generate verification token
      const verificationToken = crypto.randomUUID();

      // 3. Insert profile row with verification token
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        phone: userData.phone.trim(),
        oracle_number: userData.oracleNumber.trim(),
        role: userData.role,
        department: userData.department || "Building Certification Department",
        avatar: userData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        status: "active",
        email_verified: false,
        verification_token: verificationToken,
      });

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // 4. Audit log
      if (user) {
        await supabase.from("audit_log").insert({
          user_id: user.id,
          action: "create_user",
          entity_type: "profile",
          entity_id: authData.user.id,
          details: { name: userData.name, email: userData.email, role: userData.role },
        });
      }

      // 5. Send verification email via EmailJS (fire-and-forget)
      sendVerificationEmail({
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        token: verificationToken,
        password: userData.password,
        role: userData.role,
      }).catch(() => {}); // silently ignore email failures

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to create user account." };
    }
  };

  const deleteUser = async (id: string) => {
    if (id === user?.id) return false; // Can't delete self
    try {
      await callEdgeFunction('delete-user', { userId: id });
      if (user) {
        await supabase.from("audit_log").insert({
          user_id: user.id, action: "delete_user", entity_type: "profile", entity_id: id,
        });
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (!error && user) {
      await supabase.from("audit_log").insert({
        user_id: user.id, action: "update_role", entity_type: "profile", entity_id: id,
        details: { new_role: role },
      });
    }
    return !error;
  };

  const resetPassword = async (id: string, newPassword: string) => {
    try {
      await callEdgeFunction('reset-password', { userId: id, newPassword });
      return true;
    } catch (e) {
      console.error("Failed to reset password:", e);
      return false;
    }
  };

  const suspendUser = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ status: "suspended" }).eq("id", id);
    return !error;
  };

  const activateUser = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", id);
    return !error;
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      loginWithCredentials, login, logout,
      getAllUsers, createUser, deleteUser, updateUserRole,
      resetPassword, suspendUser, activateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Backward compat exports
export const ALL_USERS: AppUser[] = [];
export const DEMO_USERS: Record<UserRole, AppUser> = {
  billing_officer: { id: "", name: "", email: "", phone: "", oracleNumber: "", role: "billing_officer", department: "", emailVerified: true },
  certification_officer: { id: "", name: "", email: "", phone: "", oracleNumber: "", role: "certification_officer", department: "", emailVerified: true },
};
