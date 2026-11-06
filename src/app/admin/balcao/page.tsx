import { requireAdmin } from "@/lib/admin";
import { CounterSale } from "./counter-sale";

export default async function BalcaoPage() {
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: flowers }] = await Promise.all([
    supabase.from("products").select("id, name, price_cents, stock, flower_count, made_to_order").eq("active", true).order("price_cents"),
    supabase.from("flowers").select("id, slug, name, extra_price_cents, stock").eq("active", true).order("position").order("name"),
  ]);
  return (
    <div>
      <h1 className="font-serif text-4xl">Venda no balcão</h1>
      <p className="mt-1 text-sm text-muted">Registra a venda, baixa o estoque e gera o comprovante de compra.</p>
      <CounterSale products={products ?? []} flowers={flowers ?? []} />
    </div>
  );
}
