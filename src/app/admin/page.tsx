import Link from "next/link";
import { orderStatusLabel, requireAdmin } from "@/lib/admin";
import { addDays, formatDateLabel, nowInSaoPaulo } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { OrderStatusButtons } from "./order-status-buttons";

type Search = { data?: string };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const today = nowInSaoPaulo().date;
  const { data: param } = await searchParams;
  const date = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : today;

  const [{ data: orders, error }, { data: lowStock }, { count: awaitingPayment }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, code, status, stock_issue, fulfillment, customer_name, customer_phone, recipient_name, total_cents, delivery_address, delivery_slots(label, starts_at), order_items(product_name, quantity)",
      )
      .eq("scheduled_date", date)
      .not("status", "in", "(cancelado,aguardando_pagamento)")
      .order("created_at"),
    supabase.from("products").select("id, name, stock, low_stock_threshold").eq("active", true).order("stock"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "aguardando_pagamento")
      .gte("scheduled_date", today),
  ]);
  if (error) throw error;

  const alerts = (lowStock ?? []).filter((p) => p.stock <= p.low_stock_threshold);
  const sorted = [...(orders ?? [])].sort((a, b) => {
    const sa = (a.delivery_slots as unknown as { starts_at: string } | null)?.starts_at ?? "";
    const sb = (b.delivery_slots as unknown as { starts_at: string } | null)?.starts_at ?? "";
    return sa.localeCompare(sb);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-muted uppercase">Agenda</p>
          <h1 className="font-serif text-4xl capitalize">{date === today ? "Hoje" : formatDateLabel(date)}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/admin?data=${addDays(date, -1)}`} className="rounded-full border border-rose-soft px-4 py-2 hover:border-wine">←</Link>
          <Link href="/admin" className="rounded-full border border-rose-soft px-4 py-2 hover:border-wine">Hoje</Link>
          <Link href={`/admin?data=${addDays(date, 1)}`} className="rounded-full border border-rose-soft px-4 py-2 hover:border-wine">→</Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl border border-wine/30 bg-wine/5 p-4 text-sm">
          <strong className="text-wine">Estoque baixo:</strong>{" "}
          {alerts.map((p) => `${p.name} (${p.stock})`).join(", ")} ·{" "}
          <Link href="/admin/estoque" className="underline">repor</Link>
        </div>
      )}

      {(awaitingPayment ?? 0) > 0 && (
        <p className="text-xs text-muted">{awaitingPayment} pedido(s) online ainda aguardando pagamento não aparecem na agenda.</p>
      )}

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rose-soft p-10 text-center text-muted">Nenhum pedido confirmado para este dia.</p>
      ) : (
        <ul className="space-y-4">
          {sorted.map((order) => {
            const slot = order.delivery_slots as unknown as { label: string } | null;
            const address = order.delivery_address as { street: string; number: string; neighborhood: string; complement?: string } | null;
            return (
              <li key={order.id} className="rounded-2xl border border-rose-soft bg-white/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">
                      {slot?.label ?? "Sem horário"} · {order.fulfillment === "entrega" ? "Entrega" : "Retirada"} · #{order.code}
                    </p>
                    <Link href={`/admin/pedidos/${order.id}`} className="font-serif text-2xl hover:text-wine">
                      {order.recipient_name || order.customer_name}
                    </Link>
                    <p className="text-sm">{order.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}</p>
                    {address && (
                      <p className="mt-1 text-xs text-muted">
                        {address.street}, {address.number}
                        {address.complement ? ` (${address.complement})` : ""} · {address.neighborhood}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-blush px-3 py-1 text-xs text-wine">{orderStatusLabel[order.status]}</span>
                    <p className="mt-2 text-sm text-muted">{formatPrice(order.total_cents)}</p>
                  </div>
                </div>
                {order.stock_issue && (
                  <p className="mt-3 rounded-xl bg-wine/10 p-2 text-xs text-wine">{order.stock_issue}. Troque a peça ou estorne.</p>
                )}
                <OrderStatusButtons orderId={order.id} status={order.status} fulfillment={order.fulfillment} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
