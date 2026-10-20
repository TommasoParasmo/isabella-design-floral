import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/clear-cart";
import { formatDateLabel } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusText: Record<string, { title: string; text: string }> = {
  aguardando_pagamento: {
    title: "Aguardando pagamento",
    text: "Assim que o Mercado Pago confirmar, seu pedido entra na agenda da Isa. Pagamentos via Pix costumam ser confirmados em instantes.",
  },
  pago: { title: "Pedido confirmado!", text: "Recebemos seu pagamento. A Isa vai preparar tudo com flores frescas no dia agendado." },
  em_preparo: { title: "Em preparo", text: "Suas flores estão sendo montadas agora no ateliê." },
  saiu_para_entrega: { title: "Saiu para entrega", text: "Seu pedido está a caminho." },
  entregue: { title: "Entregue", text: "Pedido entregue. Obrigada pela confiança!" },
  retirado: { title: "Retirado", text: "Pedido retirado no ateliê. Obrigada!" },
  cancelado: { title: "Pedido cancelado", text: "Este pedido foi cancelado. Se tiver dúvidas, fale com a Isa." },
};

type Search = { status?: string; collection_status?: string };

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Search>;
}) {
  const { code } = await params;
  const query = await searchParams;
  if (!/^[A-F0-9]{8}$/.test(code)) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "code, status, fulfillment, scheduled_date, mp_preference_id, subtotal_cents, delivery_fee_cents, total_cents, delivery_slots(label), order_items(product_name, quantity, unit_price_cents)",
    )
    .eq("code", code)
    .maybeSingle();
  if (!order) notFound();

  const status = statusText[order.status] ?? statusText.aguardando_pagamento;
  // O Mercado Pago volta para esta página em sucesso, pendência ou falha.
  // Só esvazia o carrinho quando o pagamento foi aprovado ou está em análise (Pix).
  const returned = query.collection_status ?? query.status;
  const paymentFailed = returned === "rejected" || returned === "null" || returned === "failure";
  const keepCart = order.status === "aguardando_pagamento" && (paymentFailed || !returned);
  const retryUrl =
    order.status === "aguardando_pagamento" && order.mp_preference_id
      ? `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${order.mp_preference_id}`
      : null;
  const slot = order.delivery_slots as unknown as { label: string } | null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      {!keepCart && <ClearCart />}
      <p className="font-script text-3xl text-wine/80">pedido {order.code}</p>
      <h1 className="mt-2 font-serif text-5xl">{status.title}</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
        {paymentFailed && order.status === "aguardando_pagamento"
          ? "O pagamento não foi concluído. Você pode tentar de novo com outro cartão ou pelo Pix."
          : status.text}
      </p>
      {retryUrl && (
        <a href={retryUrl} className="mt-6 inline-block rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep">
          {paymentFailed ? "Tentar pagar de novo" : "Ir para o pagamento"}
        </a>
      )}

      <div className="mt-10 rounded-3xl border border-rose-soft bg-blush/50 p-6 text-left text-sm">
        {order.scheduled_date && (
          <p className="capitalize">
            <strong className="font-medium normal-case">{order.fulfillment === "entrega" ? "Entrega" : "Retirada"}:</strong>{" "}
            {formatDateLabel(order.scheduled_date)}
            {slot ? ` · ${slot.label}` : ""}
          </p>
        )}
        <ul className="mt-4 space-y-1 border-t border-rose-soft pt-4">
          {order.order_items.map((item) => (
            <li key={item.product_name} className="flex justify-between">
              <span>{item.quantity}× {item.product_name}</span>
              <span>{formatPrice(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
          {order.delivery_fee_cents > 0 && (
            <li className="flex justify-between text-muted">
              <span>Entrega</span>
              <span>{formatPrice(order.delivery_fee_cents)}</span>
            </li>
          )}
        </ul>
        <p className="mt-4 flex justify-between border-t border-rose-soft pt-4">
          <span>Total</span>
          <span className="font-serif text-2xl text-wine">{formatPrice(order.total_cents)}</span>
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={whatsappLink(`Olá, Isa! Tenho uma dúvida sobre o pedido ${order.code}.`)}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-wine px-7 py-3 text-sm text-wine hover:bg-blush"
        >
          Falar com a Isa
        </a>
        <Link href="/loja" className="rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep">
          Voltar para a loja
        </Link>
      </div>
    </section>
  );
}
