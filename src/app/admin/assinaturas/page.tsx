import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

const statusStyle: Record<string, string> = {
  ativa: "bg-green-100 text-green-900",
  pendente: "bg-blush text-muted",
  pausada: "bg-amber-100 text-amber-900",
  cancelada: "bg-neutral-100 text-neutral-500",
};
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function AssinaturasAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, status, kind, gift_months, gift_recipient_name, customer_name, customer_phone, preferred_weekday, delivery_address, total_cents, ends_on, created_at, subscription_plans(name, frequency)")
    .neq("status", "pendente")
    .order("created_at", { ascending: false });

  const active = (subs ?? []).filter((s) => s.status === "ativa");

  return (
    <div>
      <h1 className="font-serif text-4xl">Assinaturas</h1>
      <p className="mt-1 text-sm text-muted">{active.length} ativa(s). Pendentes de pagamento não aparecem aqui.</p>
      <ul className="mt-6 space-y-3">
        {(subs ?? []).map((s) => {
          const plan = s.subscription_plans as unknown as { name: string; frequency: string } | null;
          const address = s.delivery_address as { street: string; number: string; neighborhood: string } | null;
          return (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-rose-soft p-4 text-sm">
              <div>
                <p className="font-medium">
                  {s.kind === "presente" ? `${s.gift_recipient_name} (presente de ${s.customer_name})` : s.customer_name}
                </p>
                <p className="text-muted">
                  {plan?.name} · entregas {plan?.frequency} · {s.preferred_weekday != null ? weekdays[s.preferred_weekday] : "—"}
                  {s.kind === "presente" && ` · ${s.gift_months} meses, até ${s.ends_on ?? "—"}`}
                </p>
                {address && <p className="text-xs text-muted">{address.street}, {address.number} · {address.neighborhood}</p>}
                <p className="text-xs text-muted">{s.customer_phone}</p>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-3 py-1 text-xs ${statusStyle[s.status]}`}>{s.status}</span>
                <p className="mt-2 text-muted">{s.total_cents != null ? formatPrice(s.total_cents) : ""}{s.kind === "recorrente" ? "/mês" : ""}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
