import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client (anon key; RLS protects the data).
 * Returns null when the project isn't configured yet, so the app keeps
 * working from the static catalogue in src/data during development.
 */
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: true } }) : null;
  return client;
}

export const isSupabaseConfigured = () => getSupabase() !== null;
