import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// Garante que quem está logado é administradora. Retorna o cliente com a
// sessão dela, então todas as escritas passam pelas regras de RLS.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("is_admin, full_name").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/entrar?erro=sem-acesso");

  return { supabase, user, name: profile.full_name ?? user.email ?? "Isa" };
}

export { statusLabels as orderStatusLabel } from "@/app/admin/status";
