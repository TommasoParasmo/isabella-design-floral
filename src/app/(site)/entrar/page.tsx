"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("erro") === "sem-acesso" ? "Esta conta não tem acesso ao painel." : "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    const back = params.get("voltar");
    router.replace(back?.startsWith("/admin") ? back : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-rose-soft bg-cream px-4 py-3 text-sm outline-none focus:border-wine"
      />
      <input
        type="password"
        required
        autoComplete="current-password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-rose-soft bg-cream px-4 py-3 text-sm outline-none focus:border-wine"
      />
      {error && <p className="text-sm text-wine" role="alert">{error}</p>}
      <button disabled={loading} className="w-full rounded-full bg-wine py-3 text-sm text-cream hover:bg-wine-deep disabled:opacity-60">
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function EntrarPage() {
  return (
    <section className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-center font-serif text-4xl">Painel do ateliê</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
