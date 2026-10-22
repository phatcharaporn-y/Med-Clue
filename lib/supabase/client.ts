import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createSupabaseClient> | undefined;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  browserClient ??= createSupabaseClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}
