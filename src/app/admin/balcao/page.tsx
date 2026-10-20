import { requireAdmin } from "@/lib/admin";
import { CounterSale } from "./counter-sale";

export default async function BalcaoPage() {
  const { supabase } = await requireAdmin();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, stock")
    .eq("active", true)
    .order("name");
  return (
    <div>
      <h1 className="font-serif text-4xl">Venda no balcão</h1>
      <p className="mt-1 text-sm text-muted">Registra a venda, baixa o estoque e deixa pronta para a NFC-e.</p>
      <CounterSale products={products ?? []} />
    </div>
  );
}
