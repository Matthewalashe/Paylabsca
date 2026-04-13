// ============================================================
// supabase.ts — Supabase client initialization
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Running in offline mode.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Create a fresh client that doesn't share session storage.
 * Used for admin operations (e.g., creating users without logging out current user).
 */
export function createAdminClient() {
  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
