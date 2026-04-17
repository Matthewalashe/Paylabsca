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
      // Bypass navigator.locks to prevent 5000ms deadlock timeout
      // in environments where Web Locks API causes contention
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      },
      storageKey: "sb-cnxuszpzbxgpxnjtesca-auth-token",
    },
  }
);

/**
 * Create a fresh client that doesn't share session storage.
 * Used for isolated operations (e.g., creating users without logging out current user).
 */
export function createIsolatedClient() {
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

/** Helper to call edge functions safely */
export async function callEdgeFunction(functionName: string, body: any) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });
  if (error) throw new Error(error.message || `Failed to call ${functionName}`);
  if (data?.error) throw new Error(data.error);
  return data;
}
