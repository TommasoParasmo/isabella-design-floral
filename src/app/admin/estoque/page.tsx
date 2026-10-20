import { requireAdmin } from "@/lib/admin";
import { addStockMovement } from "../actions";

const reasonLabel: Record<string, string> = {
  compra: "Entrada",
  venda_online: "Venda online",
  venda_balcao: "Venda balcão",
  perda: "Perda",
  ajuste: "Ajuste",
  cancelamento: "Cancelamento",
};

export default async function EstoquePage() {
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase.from("products").select("id, name, stock, low_stock_threshold, active").order("name"),
    supabase
      .from("stock_movements")
      .select("id, quantity, reason, note, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-serif text-4xl">Estoque</h1>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-rose-soft text-left text-xs text-muted">
              <th className="py-2 font-normal">Produto</th>
              <th className="py-2 text-right font-normal">Em estoque</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className={`border-b border-rose-soft/60 ${p.active ? "" : "opacity-50"}`}>
                <td className="py-3">{p.name}</td>
                <td className={`py-3 text-right font-medium ${p.stock <= p.low_stock_threshold ? "text-wine" : ""}`}>
                  {p.stock}
                  {p.stock <= p.low_stock_threshold && <span className="ml-2 text-xs font-normal">baixo</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-10 font-serif text-2xl">Últimas movimentações</h2>
        <ul className="mt-3 divide-y divide-rose-soft/60 text-sm">
          {(movements ?? []).map((m) => (
            <li key={m.id} className="flex justify-between gap-3 py-2">
              <span>
                {(m.products as unknown as { name: string } | null)?.name} · <span className="text-muted">{reasonLabel[m.reason]}</span>
                {m.note && <span className="text-muted"> · {m.note}</span>}
              </span>
              <span className={m.quantity < 0 ? "text-wine" : "text-green-800"}>
                {m.quantity > 0 ? "+" : ""}
                {m.quantity}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <form action={addStockMovement} className="h-fit space-y-3 rounded-2xl border border-rose-soft bg-blush/50 p-5 lg:sticky lg:top-6">
        <h2 className="font-serif text-2xl">Registrar movimentação</h2>
        <select name="productId" required className="w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm">
          <option value="">Produto…</option>
          {(products ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select name="reason" className="rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm">
            <option value="compra">Entrada</option>
            <option value="perda">Perda</option>
            <option value="ajuste">Ajuste (±)</option>
          </select>
          <input name="quantity" type="number" required placeholder="Qtd." className="rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm" />
        </div>
        <input name="note" placeholder="Observação (opcional)" className="w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm" />
        <button className="w-full rounded-full bg-wine py-2.5 text-sm text-cream hover:bg-wine-deep">Salvar</button>
        <p className="text-xs text-muted">Vendas online e no balcão baixam o estoque sozinhas.</p>
      </form>
    </div>
  );
}
