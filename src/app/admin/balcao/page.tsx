import { requireAdmin } from "@/lib/admin";
import { CounterSale } from "./counter-sale";
import { WorkshopSale } from "./workshop-sale";

export default async function BalcaoPage() {
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: flowers }, { data: workshops }] = await Promise.all([
    supabase.from("products").select("id, name, price_cents, stock, flower_count, made_to_order").eq("active", true).order("price_cents"),
    supabase.from("flowers").select("id, slug, name, extra_price_cents, stock").eq("active", true).order("position").order("name"),
    supabase
      .from("workshops")
      .select("id, title, starts_at, price_cents, capacity, workshop_registrations(seats, status, created_at)")
      .eq("active", true)
      .gte("starts_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .order("starts_at"),
  ]);
  // Mesma conta do site: confirmadas + reservas online dos últimos 30 minutos.
  const reservedSince = Date.now() - 30 * 60 * 1000;
  const upcoming = (workshops ?? []).map(({ workshop_registrations: regs, ...w }) => ({
    ...w,
    seats_left:
      w.capacity -
      regs
        .filter((r) => r.status === "confirmada" || (r.status === "aguardando_pagamento" && new Date(r.created_at).getTime() > reservedSince))
        .reduce((n, r) => n + r.seats, 0),
  }));
  return (
    <div>
      <h1 className="font-serif text-4xl">Venda no balcão</h1>
      <p className="mt-1 text-sm text-muted">Registra a venda, baixa o estoque e gera o comprovante de compra.</p>
      <WorkshopSale workshops={upcoming} />
      <CounterSale products={products ?? []} flowers={flowers ?? []} />
    </div>
  );
}
