"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useCart } from "@/components/cart-provider";
import { addDays, nowInSaoPaulo, slotsForDate, type DeliverySlot } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

const inputClass =
  "w-full rounded-xl border border-rose-soft bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-wine";

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

type Props = { slots: DeliverySlot[]; cutoffHour: number; pickupAddress: string; maxInstallments: number };

export function CheckoutForm({ slots, cutoffHour, pickupAddress, maxInstallments }: Props) {
  const { items, subtotalCents, allSameDay } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = nowInSaoPaulo().date;
  const dates = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => addDays(today, i)).filter(
        (d) => slotsForDate(d, slots, allSameDay).length > 0,
      ),
    [today, slots, allSameDay],
  );

  const [fulfillment, setFulfillment] = useState<"entrega" | "retirada">("entrega");
  const [chosenDate, setDate] = useState("");
  // O carrinho carrega depois da primeira renderização; se a data escolhida
  // deixou de valer (ex.: item sem entrega no dia), cai para a primeira válida.
  const date = dates.includes(chosenDate) ? chosenDate : (dates[0] ?? "");
  const availableSlots = slotsForDate(date, slots, allSameDay);
  const [slotId, setSlotId] = useState("");
  const slot = availableSlots.find((s) => s.id === slotId);

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "São Paulo",
    state: "SP",
  });
  const [recipientName, setRecipientName] = useState("");
  const [cardMessage, setCardMessage] = useState("");

  const deliveryFee = fulfillment === "entrega" && slot ? slot.fee_cents : 0;
  const total = subtotalCents + deliveryFee;

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setAddress((a) => ({
        ...a,
        street: data.logradouro || a.street,
        neighborhood: data.bairro || a.neighborhood,
        city: data.localidade || a.city,
        state: data.uf || a.state,
      }));
    } catch {
      // sem autocompletar: o cliente preenche à mão
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer,
        fulfillment,
        scheduledDate: date,
        slotId,
        recipientName,
        cardMessage,
        address: fulfillment === "entrega" ? address : undefined,
      });
      if (result.ok) {
        window.location.href = result.redirectUrl;
      } else {
        setError(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-muted">Seu carrinho está vazio.</p>
        <Link href="/loja" className="mt-6 inline-block rounded-full bg-wine px-7 py-3 text-sm text-cream">
          Ver a loja
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-12 grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-10">
        {/* Entrega ou retirada */}
        <fieldset className="min-w-0">
          <legend className="font-serif text-2xl">1. Como você quer receber?</legend>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["entrega", "retirada"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFulfillment(option)}
                className={`rounded-2xl border p-4 text-left text-sm transition-colors ${
                  fulfillment === option ? "border-wine bg-blush" : "border-rose-soft hover:border-wine"
                }`}
              >
                <span className="block font-medium">{option === "entrega" ? "Entrega" : "Retirar no ateliê"}</span>
                <span className="text-xs text-muted">
                  {option === "entrega" ? "Em São Paulo, no período escolhido" : pickupAddress}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Data e período */}
        <fieldset className="min-w-0">
          <legend className="font-serif text-2xl">2. Quando?</legend>
          <p className="mt-1 text-xs text-muted">
            {allSameDay
              ? `Pedidos até ${cutoffHour}h podem ser entregues no mesmo dia.`
              : "Alguns itens do carrinho precisam de agendamento a partir de amanhã."}
          </p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDate(d);
                  setSlotId("");
                }}
                className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border px-2 py-3 text-xs transition-colors ${
                  d === date ? "border-wine bg-wine text-cream" : "border-rose-soft hover:border-wine"
                }`}
              >
                <span className="capitalize">{d === today ? "Hoje" : weekday.format(new Date(`${d}T12:00:00Z`))}</span>
                <span className="font-serif text-2xl leading-tight">{d.slice(8)}</span>
                <span className="opacity-80">{monthShort.format(new Date(`${d}T12:00:00Z`)).replace(".", "")}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {availableSlots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlotId(s.id)}
                className={`rounded-2xl border p-3 text-left text-sm transition-colors ${
                  s.id === slotId ? "border-wine bg-blush" : "border-rose-soft hover:border-wine"
                }`}
              >
                <span className="block">{s.label}</span>
                {fulfillment === "entrega" && <span className="text-xs text-muted">Taxa {formatPrice(s.fee_cents)}</span>}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Endereço */}
        {fulfillment === "entrega" && (
          <fieldset className="min-w-0 space-y-3">
            <legend className="font-serif text-2xl">3. Endereço de entrega</legend>
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <input
                className={inputClass}
                placeholder="CEP"
                inputMode="numeric"
                required
                value={address.cep}
                onChange={(e) => setAddress({ ...address, cep: e.target.value })}
                onBlur={(e) => lookupCep(e.target.value)}
              />
              <input className={inputClass} placeholder="Rua" required value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={inputClass} placeholder="Número" required value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
              <input className={`${inputClass} sm:col-span-2`} placeholder="Complemento" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_80px]">
              <input className={inputClass} placeholder="Bairro" required value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
              <input className={inputClass} placeholder="Cidade" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <input className={inputClass} placeholder="UF" required maxLength={2} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} />
            </div>
          </fieldset>
        )}

        {/* Cartão */}
        <fieldset className="min-w-0 space-y-3">
          <legend className="font-serif text-2xl">{fulfillment === "entrega" ? "4" : "3"}. Para quem são as flores?</legend>
          <input className={inputClass} placeholder="Nome de quem vai receber (opcional)" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          <textarea
            className={`${inputClass} min-h-28`}
            placeholder="Mensagem do cartão (opcional)"
            maxLength={400}
            value={cardMessage}
            onChange={(e) => setCardMessage(e.target.value)}
          />
        </fieldset>

        {/* Dados do comprador */}
        <fieldset className="min-w-0 space-y-3">
          <legend className="font-serif text-2xl">{fulfillment === "entrega" ? "5" : "4"}. Seus dados</legend>
          <input className={inputClass} placeholder="Nome completo" autoComplete="name" required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputClass} type="email" placeholder="E-mail" autoComplete="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            <input className={inputClass} type="tel" placeholder="Celular com DDD" autoComplete="tel" required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          </div>
          <input className={inputClass} placeholder="CPF (para a nota fiscal)" inputMode="numeric" required value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: e.target.value })} />
        </fieldset>
      </div>

      {/* Resumo */}
      <aside className="h-fit rounded-3xl border border-rose-soft bg-blush/60 p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl">Resumo</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span>{i.quantity}× {i.name}</span>
              <span>{formatPrice(i.priceCents * i.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-rose-soft pt-2 text-muted">
            <span>{fulfillment === "entrega" ? "Entrega" : "Retirada"}</span>
            <span>{fulfillment === "entrega" ? (slot ? formatPrice(deliveryFee) : "escolha o período") : "grátis"}</span>
          </li>
        </ul>
        <p className="mt-4 flex justify-between border-t border-rose-soft pt-4">
          <span>Total</span>
          <span className="font-serif text-3xl text-wine">{formatPrice(total)}</span>
        </p>
        <p className="mt-1 text-right text-xs text-muted">Pix ou cartão em até {maxInstallments}x</p>
        {error && <p className="mt-4 rounded-xl bg-wine/10 p-3 text-sm text-wine" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={pending || !slot}
          className="mt-6 w-full rounded-full bg-wine px-6 py-4 text-sm text-cream transition-colors hover:bg-wine-deep disabled:opacity-50"
        >
          {pending ? "Gerando pagamento…" : "Ir para o pagamento"}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted">Pagamento seguro pelo Mercado Pago</p>
      </aside>
    </form>
  );
}
