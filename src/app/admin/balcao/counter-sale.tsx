"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FlowerPicker, selectedCount, selectionExtraCents, selectionToChoices, type FlowerSelection } from "@/components/flower-picker";
import { flowerSummary, formatPrice } from "@/lib/format";
import type { Flower, FlowerChoice } from "@/lib/types";
import { connectPrinter, isPrinterSupported, printReceipt } from "@/lib/cat-printer";
import type { ReceiptData } from "@/lib/receipt";
import { getReceiptData, registerCounterSale } from "../actions";
import { MiniPrinterButton, printErrorMessage, PrinterConnect } from "../mini-printer";

const AUTO_PRINT_KEY = "balcao:imprimir-automatico";

type Product = { id: string; name: string; price_cents: number; stock: number; flower_count: number | null; made_to_order: boolean };
type Line = { key: string; productId: string; name: string; unitPrice: number; quantity: number; flowers?: FlowerChoice[] };
const methods = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Crédito" },
  { id: "cartao_debito", label: "Débito" },
  { id: "dinheiro", label: "Dinheiro" },
] as const;

export function CounterSale({ products, flowers }: { products: Product[]; flowers: Flower[] }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [building, setBuilding] = useState<string | null>(null);
  const [selection, setSelection] = useState<FlowerSelection>({});
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("pix");
  const [cpf, setCpf] = useState("");
  const [discount, setDiscount] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string; orderId?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [printSupported, setPrintSupported] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [printStatus, setPrintStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setPrintSupported(isPrinterSupported());
    try {
      setAutoPrint(localStorage.getItem(AUTO_PRINT_KEY) !== "nao");
    } catch {
      /* sem localStorage: fica ligado */
    }
  }, []);

  function toggleAutoPrint(on: boolean) {
    setAutoPrint(on);
    try {
      localStorage.setItem(AUTO_PRINT_KEY, on ? "sim" : "nao");
    } catch {
      /* ignora */
    }
  }

  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const discountCents = Math.round(Number(discount.replace(",", ".") || 0) * 100);
  const total = Math.max(subtotal - discountCents, 0);

  // Flores já usadas nos buquês desta venda saem do saldo mostrado.
  const flowersLeft = useMemo(() => {
    const used = new Map<string, number>();
    for (const l of lines) for (const f of l.flowers ?? []) used.set(f.flowerId, (used.get(f.flowerId) ?? 0) + f.quantity * l.quantity);
    return flowers.map((f) => ({ ...f, stock: f.stock - (used.get(f.id) ?? 0) }));
  }, [flowers, lines]);

  const qty = (productId: string) => lines.find((l) => l.key === productId)?.quantity ?? 0;

  function changeProduct(p: Product, delta: number) {
    setLines((current) => {
      const q = Math.min(Math.max(qty(p.id) + delta, 0), p.made_to_order ? 99 : p.stock);
      const rest = current.filter((l) => l.key !== p.id);
      return q === 0 ? rest : [...rest, { key: p.id, productId: p.id, name: p.name, unitPrice: p.price_cents, quantity: q }];
    });
  }

  function addBouquet(p: Product) {
    const choices = selectionToChoices(flowersLeft, selection);
    setLines((current) => [
      ...current,
      {
        key: `${p.id}-${Date.now()}`,
        productId: p.id,
        name: p.name,
        unitPrice: p.price_cents + selectionExtraCents(flowersLeft, selection),
        quantity: 1,
        flowers: choices,
      },
    ]);
    setBuilding(null);
    setSelection({});
  }

  function finish() {
    setMessage(null);
    setReceipt(null);
    setPrintStatus(null);
    // Conecta já no clique: o navegador só mostra a lista de impressoras
    // durante um clique, e a venda leva alguns segundos para registrar.
    const printer = printSupported && autoPrint ? connectPrinter().then(() => null, printErrorMessage) : null;
    startTransition(async () => {
      const result = await registerCounterSale({
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          flowers: l.flowers?.map((f) => ({ flowerId: f.flowerId, quantity: f.quantity })),
        })),
        paymentMethod: method,
        customerCpf: cpf,
        discountCents,
      });
      if (result.ok) {
        setLines([]);
        setCpf("");
        setDiscount("");
        setMessage({ ok: true, text: `Venda registrada: ${formatPrice(total)}.`, orderId: result.orderId });
        if (!printSupported) return;
        const data = await getReceiptData(result.orderId);
        setReceipt(data);
        if (!printer || !data) return;
        const connectError = await printer;
        if (connectError) {
          setPrintStatus({ ok: false, text: connectError });
          return;
        }
        setPrintStatus({ ok: true, text: "Imprimindo comprovante…" });
        try {
          await printReceipt(data);
          setPrintStatus({ ok: true, text: "Comprovante impresso." });
        } catch (err) {
          setPrintStatus({ ok: false, text: printErrorMessage(err) });
        }
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="grid h-fit gap-3 sm:grid-cols-2">
        {products.map((p) =>
          p.flower_count ? (
            <li key={p.id} className={`rounded-2xl border p-4 ${building === p.id ? "border-wine sm:col-span-2" : "border-rose-soft"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted">{formatPrice(p.price_cents)} · {p.flower_count} flores</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBuilding(building === p.id ? null : p.id);
                    setSelection({});
                  }}
                  className="rounded-full border border-wine px-4 py-1.5 text-sm text-wine hover:bg-blush"
                >
                  {building === p.id ? "Fechar" : "Montar"}
                </button>
              </div>
              {building === p.id && (
                <div className="mt-4">
                  <FlowerPicker flowers={flowersLeft} total={p.flower_count} value={selection} onChange={setSelection} compact />
                  <button
                    type="button"
                    disabled={selectedCount(selection) !== p.flower_count}
                    onClick={() => addBouquet(p)}
                    className="mt-4 w-full rounded-full bg-wine py-2.5 text-sm text-cream hover:bg-wine-deep disabled:opacity-50"
                  >
                    Adicionar {p.name} · {formatPrice(p.price_cents + selectionExtraCents(flowersLeft, selection))}
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-rose-soft p-4">
              <div className="text-sm">
                <p className="font-medium">{p.name}</p>
                <p className="text-muted">{formatPrice(p.price_cents)} · {p.made_to_order ? "criação livre" : `${p.stock} un.`}</p>
              </div>
              <div className="flex items-center rounded-full border border-rose-soft text-sm">
                <button type="button" className="px-3 py-1.5 text-wine" onClick={() => changeProduct(p, -1)} aria-label={`Remover ${p.name}`}>−</button>
                <span className="w-5 text-center">{qty(p.id)}</span>
                <button type="button" className="px-3 py-1.5 text-wine disabled:opacity-30" disabled={!p.made_to_order && p.stock <= qty(p.id)} onClick={() => changeProduct(p, 1)} aria-label={`Adicionar ${p.name}`}>+</button>
              </div>
            </li>
          ),
        )}
      </ul>

      <aside className="h-fit space-y-4 rounded-2xl border border-rose-soft bg-blush/50 p-5 lg:sticky lg:top-6">
        <ul className="space-y-1 text-sm">
          {lines.length === 0 && <li className="text-muted">Nenhum item.</li>}
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-2">
              <span>
                {l.quantity}× {l.name}
                {l.flowers && <span className="block text-xs text-muted">{flowerSummary(l.flowers)}</span>}
              </span>
              <span className="flex items-start gap-2">
                {formatPrice(l.unitPrice * l.quantity)}
                <button type="button" onClick={() => setLines((c) => c.filter((x) => x.key !== l.key))} className="text-muted hover:text-wine" aria-label={`Tirar ${l.name}`}>×</button>
              </span>
            </li>
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
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF do cliente (opcional)" inputMode="numeric" className="w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm" />
        <p className="flex justify-between border-t border-rose-soft pt-3">
          <span>Total</span><span className="font-serif text-3xl text-wine">{formatPrice(total)}</span>
        </p>
        {message && (
          <p className={`text-sm ${message.ok ? "text-green-800" : "text-wine"}`} role="status">
            {message.text}{" "}
            {message.orderId && (
              <Link href={`/admin/pedidos/${message.orderId}/comprovante`} className="underline hover:text-wine">
                Ver comprovante
              </Link>
            )}
          </p>
        )}
        {printStatus && (
          <p className={`text-xs ${printStatus.ok ? "text-green-800" : "text-wine"}`} role="status">{printStatus.text}</p>
        )}
        {receipt && !pending && <MiniPrinterButton receipt={receipt} className="w-full rounded-full border border-wine py-2 text-sm text-wine hover:bg-blush disabled:opacity-60" />}
        <button
          type="button"
          disabled={pending || lines.length === 0}
          onClick={finish}
          className="w-full rounded-full bg-wine py-3 text-sm text-cream hover:bg-wine-deep disabled:opacity-50"
        >
          {pending ? "Registrando…" : "Finalizar venda"}
        </button>
        {printSupported && (
          <div className="space-y-1 text-xs text-muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoPrint} onChange={(e) => toggleAutoPrint(e.target.checked)} className="accent-wine" />
              Imprimir o comprovante na mini impressora ao finalizar
            </label>
            <PrinterConnect />
          </div>
        )}
      </aside>
    </div>
  );
}
