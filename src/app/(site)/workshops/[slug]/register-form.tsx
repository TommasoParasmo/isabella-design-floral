"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/address-fields";
import { formatPrice } from "@/lib/format";
import { registerForWorkshop } from "./actions";

export function RegisterForm({ slug, priceCents, seatsLeft }: { slug: string; priceCents: number; seatsLeft: number }) {
  const [seats, setSeats] = useState(1);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const max = Math.min(4, seatsLeft);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerForWorkshop({ workshopSlug: slug, seats, customer });
      if (result.ok) window.location.href = result.redirectUrl;
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-rose-soft bg-blush/60 p-6">
      <h2 className="font-serif text-3xl">Garantir minha vaga</h2>
      <div className="flex items-center justify-between text-sm">
        <span>Vagas</span>
        <div className="flex items-center rounded-full border border-rose-soft bg-cream">
          <button type="button" className="px-4 py-2 text-wine" onClick={() => setSeats((s) => Math.max(1, s - 1))} aria-label="Menos vagas">−</button>
          <span className="w-5 text-center">{seats}</span>
          <button type="button" className="px-4 py-2 text-wine disabled:opacity-30" disabled={seats >= max} onClick={() => setSeats((s) => Math.min(max, s + 1))} aria-label="Mais vagas">+</button>
        </div>
      </div>
      <input className={inputClass} placeholder="Nome completo" autoComplete="name" required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
      <input className={inputClass} type="email" placeholder="E-mail" autoComplete="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
      <input className={inputClass} type="tel" placeholder="Celular com DDD" autoComplete="tel" required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
      <input className={inputClass} placeholder="CPF (para a nota fiscal)" inputMode="numeric" required value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: e.target.value })} />
      <p className="flex items-baseline justify-between border-t border-rose-soft pt-3">
        <span>Total</span>
        <span className="font-serif text-3xl text-wine">{formatPrice(priceCents * seats)}</span>
      </p>
      {error && <p className="rounded-xl bg-wine/10 p-3 text-sm text-wine" role="alert">{error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-wine py-4 text-sm text-cream hover:bg-wine-deep disabled:opacity-50">
        {pending ? "Reservando…" : "Ir para o pagamento"}
      </button>
      <p className="text-center text-[11px] text-muted">A vaga fica reservada por 30 minutos enquanto você paga.</p>
    </form>
  );
}
