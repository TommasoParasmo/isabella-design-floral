import "server-only";
import { addDays, nowInSaoPaulo } from "./delivery";
import { formatPrice } from "./format";
import { notifyAdmins } from "./push";
import { createAdminClient } from "./supabase/admin";

// Textos dos avisos de venda que chegam no celular da Isa.

function shortDate(isoDate: string | null) {
  if (!isoDate) return "sem data";
  const today = nowInSaoPaulo().date;
  if (isoDate === today) return "hoje";
  if (isoDate === addDays(today, 1)) return "amanhã";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" })
    .format(new Date(`${isoDate}T12:00:00Z`))
    .replace(".", "");
}

export async function alertOrderPaid(orderId: string) {
  const { data: o } = await createAdminClient()
    .from("orders")
    .select("id, code, fulfillment, customer_name, total_cents, scheduled_date, delivery_slots(label), order_items(product_name, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return;
  const slot = o.delivery_slots as unknown as { label: string } | null;
  const items = o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ");
  const when = `${o.fulfillment === "entrega" ? "Entrega" : "Retirada"} ${shortDate(o.scheduled_date)}${slot ? `, ${slot.label}` : ""}`;
  await notifyAdmins({
    title: `Novo pedido · ${formatPrice(o.total_cents)}`,
    body: `${o.customer_name}: ${items}\n${when}`,
    url: `/admin/pedidos/${o.id}`,
    tag: `pedido-${o.id}`,
  });
}

// Chamado depois de confirmar o pagamento de uma inscrição que estava
// aguardando: ou ela foi confirmada, ou a turma lotou antes do pagamento.
export async function alertWorkshopPaid(registrationId: string) {
  const { data: r } = await createAdminClient()
    .from("workshop_registrations")
    .select("id, name, seats, total_cents, status, issue, workshops(title, starts_at)")
    .eq("id", registrationId)
    .maybeSingle();
  if (!r) return;
  const confirmed = r.status === "confirmada";
  if (!confirmed && !(r.status === "cancelada" && r.issue)) return;
  const ws = r.workshops as unknown as { title: string; starts_at: string } | null;
  const day = ws ? shortDate(nowInSaoPaulo(new Date(ws.starts_at)).date) : "";
  await notifyAdmins({
    title: confirmed ? `Nova inscrição · ${ws?.title ?? "Workshop"}` : "Inscrição paga, mas a turma lotou",
    body: confirmed
      ? `${r.name}: ${r.seats} vaga(s), turma de ${day}${r.total_cents != null ? ` · ${formatPrice(r.total_cents)}` : ""}`
      : `${r.name} pagou ${ws?.title ?? "o workshop"} (${day}) depois que lotou. Estorne ou ofereça outra data.`,
    url: "/admin/workshops",
    tag: `workshop-${r.id}`,
  });
}

export async function alertSubscriptionStarted(subscriptionId: string) {
  const { data: s } = await createAdminClient()
    .from("subscriptions")
    .select("id, kind, customer_name, gift_recipient_name, gift_months, total_cents, subscription_plans(name)")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (!s) return;
  const plan = (s.subscription_plans as unknown as { name: string } | null)?.name ?? "Assinatura";
  const gift = s.kind === "presente";
  await notifyAdmins({
    title: gift ? "Nova assinatura de presente" : "Nova assinatura",
    body: gift
      ? `${s.customer_name} deu ${plan} (${s.gift_months} meses) para ${s.gift_recipient_name}`
      : `${s.customer_name}: ${plan}${s.total_cents != null ? ` · ${formatPrice(s.total_cents)}/mês` : ""}`,
    url: "/admin/assinaturas",
    tag: `assinatura-${s.id}`,
  });
}
