import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente sem sessão para dados públicos do catálogo (permite cache estático).
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
