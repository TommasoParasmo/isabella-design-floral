"use client";

import { useActionState, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { registerWorkshopCounterSale } from "../actions";

type Workshop = { id: string; title: string; starts_at: string; price_cents: number; capacity: number; seats_left: number };

const field = "w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm";
const methods = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Crédito" },
  { id: "cartao_debito", label: "Débito" },
  { id: "dinheiro", label: "Dinheiro" },
] as const;

// Vagas de workshop vendidas pessoalmente: descontam das vagas do site.
export function WorkshopSale({ workshops }: { workshops: Workshop[] }) {
  const [state, action, pending] = useActionState(registerWorkshopCounterSale, null);
  const [workshopId, setWorkshopId] = useState(workshops[0]?.id ?? "");
  const [seats, setSeats] = useState(1);
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("pix");
  const workshop = workshops.find((w) => w.id === workshopId);

  if (workshops.length === 0) return null;

  return (
    <details className="mt-6 rounded-2xl border border-rose-soft p-5" open={state != null}>
      <summary className="cursor-pointer font-serif text-2xl">Vagas de workshop</summary>
      <p className="mt-1 text-sm text-muted">Vendeu vagas pessoalmente? Registre aqui para elas saírem das vagas do site.</p>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          Turma
          <select name="workshopId" value={workshopId} onChange={(e) => setWorkshopId(e.target.value)} className={`${field} mt-1`}>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title} · {formatDateTime(w.starts_at)} · {w.seats_left} de {w.capacity} vagas livres
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Vagas vendidas
          <input
            name="seats"
            type="number"
            min={1}
            max={Math.max(workshop?.seats_left ?? 1, 1)}
            value={seats}
            onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          Valor total (R$)
          <input
            key={`${workshopId}-${seats}`}
            name="total"
            inputMode="decimal"
            defaultValue={workshop ? (workshop.price_cents * seats / 100).toFixed(2).replace(".", ",") : ""}
            className={`${field} mt-1`}
          />
        </label>
        <input name="name" placeholder="Nome do cliente (opcional)" className={field} />
        <input name="phone" placeholder="Telefone (opcional)" inputMode="tel" className={field} />
        <input name="email" type="email" placeholder="E-mail (opcional)" className={field} />
        <input name="cpf" placeholder="CPF (opcional, para a nota)" inputMode="numeric" className={field} />
        <input type="hidden" name="paymentMethod" value={method} />
        <div className="grid grid-cols-4 gap-1 sm:col-span-2">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`rounded-xl border py-2 text-xs ${method === m.id ? "border-wine bg-wine text-cream" : "border-rose-soft"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {state && (
          <p className={`text-sm sm:col-span-2 ${state.ok ? "text-green-800" : "text-wine"}`} role="status">{state.message}</p>
        )}
        <button
          disabled={pending || !workshop || workshop.seats_left < 1}
          className="rounded-full bg-wine py-2.5 text-sm text-cream hover:bg-wine-deep disabled:opacity-50 sm:col-span-2"
        >
          {pending
            ? "Registrando…"
            : workshop && workshop.seats_left < 1
              ? "Turma lotada"
              : `Registrar ${seats} vaga${seats > 1 ? "s" : ""}`}
        </button>
      </form>
    </details>
  );
}
