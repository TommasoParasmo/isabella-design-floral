import Link from "next/link";
import { notFound } from "next/navigation";
import { orderStatusLabel, requireAdmin } from "@/lib/admin";
import { formatDateLabel } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { OrderStatusButtons } from "../../order-status-buttons";
import { issueOrderInvoice } from "../../notas/actions";
import { DocumentList, type FiscalDocumentRow } from "../../notas/document-list";
import { InvoiceForm } from "../../notas/invoice-form";

export default async function PedidoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("*, delivery_slots(label), order_items(id, product_name, quantity, unit_price_cents)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const { data: documents } = await supabase
    .from("fiscal_documents")
    .select("id, kind, status, environment, number, pdf_url, xml_url, error_message, created_at, recipient")
    .eq("order_id", id)
    .order("created_at", { ascending: false });
  const fiscalDocs = (documents ?? []) as FiscalDocumentRow[];
  const canInvoice =
    !["aguardando_pagamento", "cancelado"].includes(order.status) &&
    !fiscalDocs.some((d) => d.status === "processando" || d.status === "autorizado");

  const slot = order.delivery_slots as { label: string } | null;
  const address = order.delivery_address as Record<string, string> | null;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/admin?data=${order.scheduled_date ?? ""}`} className="text-xs text-muted hover:text-wine">← Agenda</Link>
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">
          Pedido #{order.code} · {order.channel === "balcao" ? "Balcão" : "Online"}
        </p>
        <h1 className="font-serif text-4xl">{order.customer_name}</h1>
        <span className="mt-2 inline-block rounded-full bg-blush px-3 py-1 text-xs text-wine">{orderStatusLabel[order.status]}</span>
      </div>

      {order.stock_issue && (
        <p className="rounded-xl bg-wine/10 p-3 text-sm text-wine">{order.stock_issue}. Combine a troca da peça com o cliente ou estorne pelo Mercado Pago.</p>
      )}

      <dl className="grid gap-4 rounded-2xl border border-rose-soft p-5 text-sm sm:grid-cols-2">
        {order.scheduled_date && (
          <div>
            <dt className="text-xs text-muted">{order.fulfillment === "entrega" ? "Entrega" : "Retirada"}</dt>
            <dd className="capitalize">{formatDateLabel(order.scheduled_date)} {slot ? `· ${slot.label}` : ""}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted">Contato</dt>
          <dd>{order.customer_phone ?? "—"} · {order.customer_email ?? "—"}</dd>
        </div>
        {order.customer_cpf && (
          <div>
            <dt className="text-xs text-muted">CPF</dt>
            <dd>{order.customer_cpf}</dd>
          </div>
        )}
        {order.payment_method && (
          <div>
            <dt className="text-xs text-muted">Pagamento</dt>
            <dd>{order.payment_method.replace(/_/g, " ")}</dd>
          </div>
        )}
        {address && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Endereço</dt>
            <dd>
              {address.street}, {address.number} {address.complement} · {address.neighborhood} · {address.city}/{address.state} · CEP {address.cep}
            </dd>
          </div>
        )}
        {order.recipient_name && (
          <div>
            <dt className="text-xs text-muted">Quem recebe</dt>
            <dd>{order.recipient_name}</dd>
          </div>
        )}
        {order.card_message && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Mensagem do cartão</dt>
            <dd className="font-serif text-lg whitespace-pre-line italic">{order.card_message}</dd>
          </div>
        )}
      </dl>

      <ul className="rounded-2xl border border-rose-soft p-5 text-sm">
        {order.order_items.map((item: { id: string; product_name: string; quantity: number; unit_price_cents: number }) => (
          <li key={item.id} className="flex justify-between py-1">
            <span>{item.quantity}× {item.product_name}</span>
            <span>{formatPrice(item.unit_price_cents * item.quantity)}</span>
          </li>
        ))}
        {order.delivery_fee_cents > 0 && (
          <li className="flex justify-between py-1 text-muted"><span>Entrega</span><span>{formatPrice(order.delivery_fee_cents)}</span></li>
        )}
        {order.discount_cents > 0 && (
          <li className="flex justify-between py-1 text-muted"><span>Desconto</span><span>−{formatPrice(order.discount_cents)}</span></li>
        )}
        <li className="mt-2 flex justify-between border-t border-rose-soft pt-2 font-medium">
          <span>Total</span><span>{formatPrice(order.total_cents)}</span>
        </li>
      </ul>

      <OrderStatusButtons orderId={order.id} status={order.status} fulfillment={order.fulfillment} allowCancel />

      <section className="space-y-4 rounded-2xl border border-rose-soft p-5">
        <div>
          <h2 className="font-serif text-2xl">Nota fiscal</h2>
          <p className="text-xs text-muted">Como MEI, a nota é obrigatória só quando quem compra é empresa. Para pessoa física, emita se o cliente pedir.</p>
        </div>
        <DocumentList documents={fiscalDocs} />
        {canInvoice && (
          <InvoiceForm
            kind="nfe"
            action={issueOrderInvoice.bind(null, order.id)}
            defaults={{
              name: order.customer_name,
              document: order.customer_cpf ?? "",
              email: order.customer_email ?? "",
              address,
            }}
          />
        )}
      </section>
    </div>
  );
}
