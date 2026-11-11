import Link from "next/link";
import { orderStatusLabel, requireAdmin } from "@/lib/admin";
import { addDays, formatDateLabel, nowInSaoPaulo } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { pushConfigured, pushPublicKey } from "@/lib/push";
import { PhoneAlerts } from "./phone-alerts";

export const metadata = { title: "Recebidos" };

const DAYS = 30;

type Entry = {
  key: string;
  at: string;
  kind: "Pedido" | "Balcão" | "Workshop" | "Assinatura";
  who: string;
  what: string;
  when?: string;
  cents: number | null;
  badge: string;
  href: string;
};

const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const shortDay = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

function dayLabel(date: string, today: string) {
  if (date === today) return "Hoje";
  if (date === addDays(today, -1)) return "Ontem";
  return formatDateLabel(date);
}

function deliveryLabel(date: string | null, today: string) {
  if (!date) return "sem data";
  if (date === today) return "hoje";
  if (date === addDays(today, 1)) return "amanhã";
  return shortDay.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

export default async function RecebidosPage() {
  const { supabase } = await requireAdmin();
  const today = nowInSaoPaulo().date;
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [orders, registrations, subscriptions] = await Promise.all([
    supabase
      .from("orders")
      .select("id, code, channel, status, fulfillment, customer_name, recipient_name, total_cents, scheduled_date, paid_at, delivery_slots(label), order_items(product_name, quantity)")
      .gte("paid_at", since)
      .order("paid_at", { ascending: false })
      .limit(100),
    supabase
      .from("workshop_registrations")
      .select("id, name, seats, status, total_cents, paid_at, issue, workshops(title, starts_at)")
      .gte("paid_at", since)
      .order("paid_at", { ascending: false })
      .limit(50),
    supabase
      .from("subscriptions")
      .select("id, kind, status, customer_name, gift_recipient_name, gift_months, total_cents, started_at, subscription_plans(name)")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(50),
  ]);
  if (orders.error) throw orders.error;

  const entries: Entry[] = [
    ...(orders.data ?? []).map((o): Entry => {
      const slot = o.delivery_slots as unknown as { label: string } | null;
      const counter = o.channel === "balcao";
      return {
        key: `o-${o.id}`,
        at: o.paid_at!,
        kind: counter ? "Balcão" : "Pedido",
        who: o.recipient_name && o.recipient_name !== o.customer_name ? `${o.customer_name} para ${o.recipient_name}` : o.customer_name,
        what: o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", "),
        when: counter ? undefined : `${o.fulfillment === "entrega" ? "Entrega" : "Retirada"} ${deliveryLabel(o.scheduled_date, today)}${slot ? `, ${slot.label}` : ""}`,
        cents: o.total_cents,
        badge: orderStatusLabel[o.status] ?? o.status,
        href: `/admin/pedidos/${o.id}`,
      };
    }),
    ...(registrations.data ?? []).map((r): Entry => {
      const ws = r.workshops as unknown as { title: string; starts_at: string } | null;
      return {
        key: `w-${r.id}`,
        at: r.paid_at!,
        kind: "Workshop",
        who: r.name,
        what: `${ws?.title ?? "Workshop"} · ${r.seats} vaga(s)`,
        when: ws ? `Turma ${deliveryLabel(nowInSaoPaulo(new Date(ws.starts_at)).date, today)}` : undefined,
        cents: r.total_cents,
        badge: r.status === "confirmada" ? "Confirmada" : r.issue ? "Turma lotou: estornar" : r.status,
        href: "/admin/workshops",
      };
    }),
    ...(subscriptions.data ?? []).map((s): Entry => {
      const plan = (s.subscription_plans as unknown as { name: string } | null)?.name ?? "Assinatura";
      const gift = s.kind === "presente";
      return {
        key: `s-${s.id}`,
        at: s.started_at!,
        kind: "Assinatura",
        who: gift ? `${s.customer_name} para ${s.gift_recipient_name}` : (s.customer_name ?? ""),
        what: gift ? `${plan} · presente de ${s.gift_months} meses` : `${plan} · mensal`,
        cents: s.total_cents,
        badge: s.status === "ativa" ? "Ativa" : s.status,
        href: "/admin/assinaturas",
      };
    }),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const day = nowInSaoPaulo(new Date(e.at)).date;
    groups.set(day, [...(groups.get(day) ?? []), e]);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">Recebidos</p>
        <h1 className="font-serif text-4xl">Últimas vendas</h1>
        <p className="mt-1 text-sm text-muted">
          Tudo o que foi pago nos últimos {DAYS} dias, do mais novo para o mais antigo. A agenda de entregas continua na aba Agenda.
        </p>
      </div>

      {pushConfigured() ? (
        <PhoneAlerts publicKey={pushPublicKey} />
      ) : (
        <p className="rounded-2xl border border-dashed border-rose-soft p-4 text-sm text-muted">
          Os avisos no celular ainda não foram configurados no servidor (chaves VAPID na Vercel).
        </p>
      )}

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rose-soft p-10 text-center text-muted">Nenhuma venda paga nos últimos {DAYS} dias.</p>
      ) : (
        [...groups].map(([day, list]) => (
          <section key={day}>
            <h2 className="font-serif text-2xl capitalize">
              {dayLabel(day, today)} <span className="text-base text-muted">· {list.length}</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {list.map((e) => (
                <li key={e.key}>
                  <Link href={e.href} className="block rounded-2xl border border-rose-soft bg-white/60 p-4 hover:border-wine">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-muted">
                        {time.format(new Date(e.at))} · {e.kind}
                      </p>
                      <p className="font-medium whitespace-nowrap">{e.cents != null ? formatPrice(e.cents) : ""}</p>
                    </div>
                    <p className="mt-1 font-serif text-xl">{e.who}</p>
                    <p className="text-sm">{e.what}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {e.when && <span className="text-muted">{e.when}</span>}
                      <span className="rounded-full bg-blush px-3 py-0.5 text-wine">{e.badge}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
