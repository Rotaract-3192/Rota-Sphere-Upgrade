/**
 * Supabase Admin Client — Safe Server & Lazy Initialization
 * Architecture §54: "The service-role key must exist only server-side.
 * Never be exposed to browser code. Never use NEXT_PUBLIC_."
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://db.rotaract3192.org";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error(
    "[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set. " +
    "Server-side admin operations require the service role key."
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, serviceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return clientInstance;
}

// Proxy export so all existing `supabaseAdmin.from(...)` and `supabaseAdmin.rpc(...)` calls work seamlessly
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});
