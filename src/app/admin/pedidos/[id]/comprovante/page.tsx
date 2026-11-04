import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { flowerSummary, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { ReceiptActions } from "./receipt-actions";

export const metadata: Metadata = { title: "Comprovante" };

const paymentLabel: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  dinheiro: "Dinheiro",
};

type Item = { id: string; product_name: string; quantity: number; unit_price_cents: number; flowers: { name: string; quantity: number }[] | null };

export default async function ComprovantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("id, code, status, created_at, customer_name, customer_phone, customer_cpf, payment_method, delivery_fee_cents, discount_cents, total_cents, order_items(id, product_name, quantity, unit_price_cents, flowers)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const items = order.order_items as Item[];
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(order.created_at));
  const payment = order.payment_method ? (paymentLabel[order.payment_method] ?? order.payment_method.replace(/_/g, " ")) : null;
  const cnpj = process.env.FISCAL_CNPJ?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

  const unpaid = ["aguardando_pagamento", "cancelado"].includes(order.status);
  const text = [
    `*${site.name} ${site.tagline}*`,
    `Comprovante do pedido #${order.code} · ${date}`,
    "",
    ...items.flatMap((i) => [
      `${i.quantity}× ${i.product_name}: ${formatPrice(i.unit_price_cents * i.quantity)}`,
      ...(i.flowers ? [`   ${flowerSummary(i.flowers)}`] : []),
    ]),
    ...(order.delivery_fee_cents > 0 ? [`Entrega: ${formatPrice(order.delivery_fee_cents)}`] : []),
    ...(order.discount_cents > 0 ? [`Desconto: −${formatPrice(order.discount_cents)}`] : []),
    `*Total: ${formatPrice(order.total_cents)}*`,
    ...(payment ? [`Pagamento: ${payment}`] : []),
    "",
    "Obrigada pela compra! 🌷",
    "Documento sem valor fiscal.",
  ].join("\n");
  const phone = order.customer_phone?.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${phone ? (phone.length <= 11 ? `55${phone}` : phone) : ""}?text=${encodeURIComponent(text)}`;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/admin/pedidos/${order.id}`} className="text-xs text-muted hover:text-wine">← Pedido</Link>
      </div>
      {!unpaid && <ReceiptActions whatsappUrl={whatsappUrl} />}

      {/* Térmica Epson TM-T20X, bobina de 80 mm: área útil de 72 mm, só preto. */}
      <style>{`@media print {
        @page { margin: 0; }
        .receipt { width: 72mm; margin: 0 auto; padding: 3mm 0 8mm; font-size: 12px; }
        .receipt, .receipt * { color: #000 !important; border-color: #000 !important; background: transparent !important; }
      }`}</style>
      <article className="receipt space-y-4 rounded-2xl border border-rose-soft bg-white p-6 text-sm print:rounded-none print:border-0 print:p-0">
        <header className="text-center">
          <p className="font-script text-4xl text-wine">{site.name}</p>
          <p className="text-xs tracking-widest text-muted uppercase">{site.tagline} · {site.city}</p>
          {cnpj && <p className="text-xs text-muted">CNPJ {cnpj}</p>}
        </header>

        {unpaid && (
          <p className="rounded-xl bg-wine/10 p-2 text-center text-xs font-medium text-wine">
            {order.status === "cancelado" ? "Pedido cancelado" : "Pagamento ainda não confirmado"}
          </p>
        )}

        <div className="border-y border-dashed border-rose-soft py-3 text-center">
          <p className="font-medium">Comprovante de compra</p>
          <p className="text-xs text-muted">Pedido #{order.code} · {date}</p>
        </div>

        <dl className="space-y-1 text-xs">
          <div className="flex justify-between"><dt className="text-muted">Cliente</dt><dd>{order.customer_name}</dd></div>
          {order.customer_cpf && <div className="flex justify-between"><dt className="text-muted">CPF</dt><dd>{order.customer_cpf}</dd></div>}
          {payment && <div className="flex justify-between"><dt className="text-muted">Pagamento</dt><dd>{payment}</dd></div>}
        </dl>

        <ul className="space-y-1 border-t border-dashed border-rose-soft pt-3">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.quantity}× {i.product_name}
                {i.flowers && <span className="block text-xs text-muted">{flowerSummary(i.flowers)}</span>}
              </span>
              <span className="whitespace-nowrap">{formatPrice(i.unit_price_cents * i.quantity)}</span>
            </li>
          ))}
          {order.delivery_fee_cents > 0 && (
            <li className="flex justify-between text-muted"><span>Entrega</span><span>{formatPrice(order.delivery_fee_cents)}</span></li>
          )}
          {order.discount_cents > 0 && (
            <li className="flex justify-between text-muted"><span>Desconto</span><span>−{formatPrice(order.discount_cents)}</span></li>
          )}
        </ul>

        <p className="flex items-baseline justify-between border-t border-dashed border-rose-soft pt-3">
          <span>Total</span><span className="font-serif text-2xl text-wine">{formatPrice(order.total_cents)}</span>
        </p>

        <footer className="space-y-1 text-center text-xs text-muted">
          <p>Obrigada pela compra!</p>
          <p>@{site.instagram}</p>
          <p className="pt-2 font-medium">Documento sem valor fiscal</p>
        </footer>
      </article>
    </div>
  );
}
