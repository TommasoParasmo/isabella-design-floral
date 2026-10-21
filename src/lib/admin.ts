import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// Garante que quem está logado é administradora. Retorna o cliente com a
// sessão dela, então todas as escritas passam pelas regras de RLS.
// O cache faz o layout e a página dividirem a mesma verificação.
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  // getClaims confere a assinatura do token localmente, sem ir ao servidor de Auth.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("is_admin, full_name").eq("id", claims.sub).maybeSingle();
  if (!profile?.is_admin) redirect("/entrar?erro=sem-acesso");

  const user = { id: claims.sub, email: claims.email };
  return { supabase, user, name: profile.full_name ?? user.email ?? "Isa" };
});

export { statusLabels as orderStatusLabel } from "@/app/admin/status";
