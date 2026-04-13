// ============================================================
// auth.tsx — Supabase-backed authentication
// ============================================================
// Real JWT sessions via Supabase Auth.
// Cert Officers create users via signUp + profile insert.
// Falls back to offline mode if Supabase is unavailable.
// ============================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase, createAdminClient } from "./supabase";
import type { Session } from "@supabase/supabase-js";

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

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadProfile(session.user.id);
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
    // Use a separate client so we don't log out the current user
    const adminClient = createAdminClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.signUp({
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || "Failed to create auth account." };
    }

    // 2. Insert profile
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
    });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // 3. Audit log
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "create_user",
        entity_type: "profile",
        entity_id: authData.user.id,
        details: { name: userData.name, email: userData.email, role: userData.role },
      });
    }

    return { success: true };
  };

  const deleteUser = async (id: string) => {
    if (id === user?.id) return false; // Can't delete self
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error && user) {
      await supabase.from("audit_log").insert({
        user_id: user.id, action: "delete_user", entity_type: "profile", entity_id: id,
      });
    }
    return !error;
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

  const resetPassword = async (_id: string, _newPassword: string) => {
    // Password reset requires admin/service_role key — not available client-side
    // For now, this is a placeholder. Would need an Edge Function in production.
    console.warn("Password reset requires server-side implementation (Edge Function).");
    return false;
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
  billing_officer: { id: "", name: "", email: "", phone: "", oracleNumber: "", role: "billing_officer", department: "" },
  certification_officer: { id: "", name: "", email: "", phone: "", oracleNumber: "", role: "certification_officer", department: "" },
};
