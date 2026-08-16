/**
 * Supabase Server Client
 * Architecture §54: Service role key must never be exposed to client-side code.
 *
 * This client uses the ANON key + the user's Clerk JWT.
 * RLS policies enforce data access rules — users only see their own data.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can only be called from Server Actions / Route Handlers
          }
        },
      },
    }
  );
}
