"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { registerCounterSale } from "../actions";

type Product = { id: string; name: string; price_cents: number; stock: number };
const methods = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Crédito" },
  { id: "cartao_debito", label: "Débito" },
  { id: "dinheiro", label: "Dinheiro" },
] as const;

export function CounterSale({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("pix");
  const [cpf, setCpf] = useState("");
  const [discount, setDiscount] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const lines = products.filter((p) => cart[p.id]);
  const subtotal = lines.reduce((n, p) => n + p.price_cents * cart[p.id], 0);
  const discountCents = Math.round(Number(discount.replace(",", ".") || 0) * 100);
  const total = Math.max(subtotal - discountCents, 0);

  function change(id: string, delta: number, max: number) {
    setCart((c) => {
      const q = Math.min(Math.max((c[id] ?? 0) + delta, 0), max);
      const next = { ...c, [id]: q };
      if (q === 0) delete next[id];
      return next;
    });
  }

  function finish() {
    setMessage(null);
    startTransition(async () => {
      const result = await registerCounterSale({
        items: lines.map((p) => ({ productId: p.id, quantity: cart[p.id] })),
        paymentMethod: method,
        customerCpf: cpf,
        discountCents,
      });
      if (result.ok) {
        setCart({});
        setCpf("");
        setDiscount("");
        setMessage({ ok: true, text: `Venda registrada: ${formatPrice(total)}.` });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-rose-soft p-4">
            <div className="text-sm">
              <p className="font-medium">{p.name}</p>
              <p className="text-muted">{formatPrice(p.price_cents)} · {p.stock} un.</p>
            </div>
            <div className="flex items-center rounded-full border border-rose-soft text-sm">
              <button type="button" className="px-3 py-1.5 text-wine" onClick={() => change(p.id, -1, p.stock)} aria-label={`Remover ${p.name}`}>−</button>
              <span className="w-5 text-center">{cart[p.id] ?? 0}</span>
              <button type="button" className="px-3 py-1.5 text-wine disabled:opacity-30" disabled={p.stock <= (cart[p.id] ?? 0)} onClick={() => change(p.id, 1, p.stock)} aria-label={`Adicionar ${p.name}`}>+</button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-2xl border border-rose-soft bg-blush/50 p-5 lg:sticky lg:top-6">
        <ul className="space-y-1 text-sm">
          {lines.length === 0 && <li className="text-muted">Nenhum item.</li>}
          {lines.map((p) => (
            <li key={p.id} className="flex justify-between"><span>{cart[p.id]}× {p.name}</span><span>{formatPrice(p.price_cents * cart[p.id])}</span></li>
          ))}
        </ul>
        <div className="grid grid-cols-4 gap-1">
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
        <input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Desconto (R$)" inputMode="decimal" className="w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm" />
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF na nota (opcional)" inputMode="numeric" className="w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm" />
        <p className="flex justify-between border-t border-rose-soft pt-3">
          <span>Total</span><span className="font-serif text-3xl text-wine">{formatPrice(total)}</span>
        </p>
        {message && <p className={`text-sm ${message.ok ? "text-green-800" : "text-wine"}`} role="status">{message.text}</p>}
        <button
          type="button"
          disabled={pending || lines.length === 0}
          onClick={finish}
          className="w-full rounded-full bg-wine py-3 text-sm text-cream hover:bg-wine-deep disabled:opacity-50"
        >
          {pending ? "Registrando…" : "Finalizar venda"}
        </button>
      </aside>
    </div>
  );
}
