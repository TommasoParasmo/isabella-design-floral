import type { SupabaseClient } from "@supabase/supabase-js";
import { nowInSaoPaulo } from "./delivery";

export type Promotion = {
  id: string;
  name: string;
  percent_off: number;
  target: "categoria" | "produto" | "workshops" | "workshop";
  category_id: string | null;
  product_id: string | null;
  workshop_id: string | null;
  starts_on: string;
  ends_on: string;
  active: boolean;
};

export const PROMOTION_FIELDS = "id, name, percent_off, target, category_id, product_id, workshop_id, starts_on, ends_on, active";

// Valendo hoje: ligada e dentro das datas (de São Paulo, incluindo o último dia).
export function isRunning(p: Pick<Promotion, "active" | "starts_on" | "ends_on">, today = nowInSaoPaulo().date) {
  return p.active && p.starts_on <= today && p.ends_on >= today;
}

// Promoções valendo agora. Se a tabela ainda não existir, o site segue sem desconto.
export async function getRunningPromotions(supabase: SupabaseClient): Promise<Promotion[]> {
  const today = nowInSaoPaulo().date;
  const { data, error } = await supabase
    .from("promotions")
    .select(PROMOTION_FIELDS)
    .eq("active", true)
    .lte("starts_on", today)
    .gte("ends_on", today);
  if (error) {
    console.error("promotions", error.message);
    return [];
  }
  return data as Promotion[];
}

export function discounted(cents: number, percent: number) {
  return Math.round((cents * (100 - percent)) / 100);
}

// Maior desconto que vale para o produto (se houver mais de uma promoção, não somam).
export function productPercent(promos: Promotion[], product: { id: string; category_id: string | null }) {
  return promos.reduce((best, p) => {
    const hit =
      (p.target === "produto" && p.product_id === product.id) ||
      (p.target === "categoria" && !!product.category_id && p.category_id === product.category_id);
    return hit ? Math.max(best, p.percent_off) : best;
  }, 0);
}

export function workshopPercent(promos: Promotion[], workshopId: string) {
  return promos.reduce((best, p) => {
    const hit = p.target === "workshops" || (p.target === "workshop" && p.workshop_id === workshopId);
    return hit ? Math.max(best, p.percent_off) : best;
  }, 0);
}

// Troca price_cents pelo preço com desconto e guarda o original em list_price_cents.
// Produto sob consulta (R$ 0,00) fica como está.
export function withProductPromos<T extends { id: string; category_id: string | null; price_cents: number }>(
  items: T[],
  promos: Promotion[],
): (T & { list_price_cents: number | null; percent_off: number })[] {
  return items.map((item) => {
    const percent = item.price_cents > 0 ? productPercent(promos, item) : 0;
    return percent
      ? { ...item, price_cents: discounted(item.price_cents, percent), list_price_cents: item.price_cents, percent_off: percent }
      : { ...item, list_price_cents: null, percent_off: 0 };
  });
}

export function withWorkshopPromos<T extends { id: string; price_cents: number }>(
  items: T[],
  promos: Promotion[],
): (T & { list_price_cents: number | null; percent_off: number })[] {
  return items.map((item) => {
    const percent = item.price_cents > 0 ? workshopPercent(promos, item.id) : 0;
    return percent
      ? { ...item, price_cents: discounted(item.price_cents, percent), list_price_cents: item.price_cents, percent_off: percent }
      : { ...item, list_price_cents: null, percent_off: 0 };
  });
}
