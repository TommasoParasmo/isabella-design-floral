"use client";

import { useState, useTransition } from "react";
import { AddressFields, emptyAddress, inputClass } from "@/components/address-fields";
import { formatPrice } from "@/lib/format";
import { subscribe } from "./actions";

const weekdays = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const giftOptions = [3, 6, 12] as const;

export function SubscribeForm({ planSlug, priceCents }: { planSlug: string; priceCents: number }) {
  const [kind, setKind] = useState<"recorrente" | "presente">("recorrente");
  const [giftMonths, setGiftMonths] = useState<(typeof giftOptions)[number]>(3);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [weekday, setWeekday] = useState(5);
  const [address, setAddress] = useState(emptyAddress);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = kind === "presente" ? priceCents * giftMonths : priceCents;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await subscribe({
        planSlug,
        kind,
        giftMonths: kind === "presente" ? giftMonths : undefined,
        giftRecipientName,
        giftMessage,
        preferredWeekday: weekday,
        customer,
        address,
      });
      if (result.ok) window.location.href = result.redirectUrl;
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset className="min-w-0">
        <legend className="font-serif text-2xl">Para quem é?</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["recorrente", "presente"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-2xl border p-4 text-left text-sm ${kind === k ? "border-wine bg-blush" : "border-rose-soft hover:border-wine"}`}
            >
              <span className="block font-medium">{k === "recorrente" ? "Para mim" : "Para presentear"}</span>
              <span className="text-xs text-muted">
                {k === "recorrente" ? "Cobrança mensal no cartão, cancele quando quiser" : "Pagamento único de 3, 6 ou 12 meses"}
              </span>
            </button>
          ))}
        </div>
        {kind === "presente" && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {giftOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGiftMonths(m)}
                  className={`rounded-xl border py-3 text-sm ${giftMonths === m ? "border-wine bg-wine text-cream" : "border-rose-soft"}`}
                >
                  {m} meses
                </button>
              ))}
            </div>
            <input className={inputClass} placeholder="Nome de quem vai receber" required value={giftRecipientName} onChange={(e) => setGiftRecipientName(e.target.value)} />
            <textarea className={`${inputClass} min-h-24`} placeholder="Mensagem para o primeiro cartão (opcional)" maxLength={400} value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} />
          </div>
        )}
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="font-serif text-2xl">Dia preferido de entrega</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {weekdays.slice(1).map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => setWeekday(i + 1)}
              className={`rounded-full border px-4 py-2 text-sm ${weekday === i + 1 ? "border-wine bg-wine text-cream" : "border-rose-soft"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-3 font-serif text-2xl">Endereço de entrega</legend>
        <AddressFields value={address} onChange={setAddress} />
      </fieldset>

      <fieldset className="min-w-0 space-y-3">
        <legend className="font-serif text-2xl">Seus dados</legend>
        <input className={inputClass} placeholder="Nome completo" autoComplete="name" required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputClass} type="email" placeholder="E-mail" autoComplete="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
          <input className={inputClass} type="tel" placeholder="Celular com DDD" autoComplete="tel" required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        </div>
        <input className={inputClass} placeholder="CPF (para a nota fiscal)" inputMode="numeric" required value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: e.target.value })} />
      </fieldset>

      <div className="rounded-3xl border border-rose-soft bg-blush/60 p-6">
        <p className="flex items-baseline justify-between">
          <span>{kind === "presente" ? `Total (${giftMonths} meses)` : "Por mês"}</span>
          <span className="font-serif text-3xl text-wine">{formatPrice(total)}</span>
        </p>
        {kind === "presente" && <p className="mt-1 text-right text-xs text-muted">Pix ou cartão em até 3x</p>}
        {error && <p className="mt-4 rounded-xl bg-wine/10 p-3 text-sm text-wine" role="alert">{error}</p>}
        <button disabled={pending} className="mt-5 w-full rounded-full bg-wine py-4 text-sm text-cream hover:bg-wine-deep disabled:opacity-50">
          {pending ? "Gerando pagamento…" : kind === "presente" ? "Presentear" : "Assinar"}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted">Pagamento seguro pelo Mercado Pago</p>
      </div>
    </form>
  );
}
