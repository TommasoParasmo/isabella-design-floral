import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { saveFlower } from "../actions";

const field = "rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm outline-none focus:border-wine";
const cents = (v: number) => (v / 100).toFixed(2).replace(".", ",");

type FlowerRow = {
  id: string;
  name: string;
  stock: number;
  extra_price_cents: number;
  low_stock_threshold: number;
  position: number;
  active: boolean;
};

export default async function FloresPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("flowers")
    .select("id, name, stock, extra_price_cents, low_stock_threshold, position, active")
    .order("position")
    .order("name");
  const flowers = (data ?? []) as FlowerRow[];

  return (
    <div>
      <h1 className="font-serif text-4xl">Flores</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        São as flores que o cliente escolhe para montar o buquê. O estoque é contado em hastes: lance as compras e
        perdas em <Link href="/admin/estoque" className="underline hover:text-wine">Estoque</Link>. Cada buquê vendido
        baixa as flores escolhidas sozinho.
      </p>

      <ul className="mt-6 space-y-3">
        {flowers.map((f) => (
          <li key={f.id}>
            <form action={saveFlower} className={`flex flex-wrap items-end gap-3 rounded-2xl border border-rose-soft p-4 ${f.active ? "" : "opacity-60"}`}>
              <input type="hidden" name="id" value={f.id} />
              <label className="block text-xs text-muted">
                Nome
                <input name="name" required defaultValue={f.name} className={`${field} mt-1 block w-40 text-ink`} />
              </label>
              <div className="text-xs text-muted">
                Em estoque
                <p className={`mt-1 py-2 text-sm font-medium ${f.stock <= f.low_stock_threshold ? "text-wine" : "text-ink"}`}>
                  {f.stock} hastes{f.stock <= f.low_stock_threshold && <span className="ml-1 text-xs font-normal">baixo</span>}
                </p>
              </div>
              <label className="block text-xs text-muted">
                Acréscimo por flor (R$)
                <input name="extra_price" inputMode="decimal" defaultValue={cents(f.extra_price_cents)} className={`${field} mt-1 block w-28 text-ink`} />
              </label>
              <label className="block text-xs text-muted">
                Alerta abaixo de
                <input name="low_stock_threshold" type="number" min={0} defaultValue={f.low_stock_threshold} className={`${field} mt-1 block w-24 text-ink`} />
              </label>
              <label className="block text-xs text-muted">
                Ordem
                <input name="position" type="number" defaultValue={f.position} className={`${field} mt-1 block w-20 text-ink`} />
              </label>
              <label className="flex items-center gap-2 py-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={f.active} /> À venda
              </label>
              <button className="rounded-full border border-wine px-5 py-2 text-sm text-wine hover:bg-wine hover:text-cream">Salvar</button>
            </form>
          </li>
        ))}
        {flowers.length === 0 && <li className="text-sm text-muted">Nenhuma flor cadastrada.</li>}
      </ul>

      <form action={saveFlower} className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-rose-soft bg-blush/50 p-4">
        <h2 className="w-full font-serif text-2xl">Nova flor</h2>
        <label className="block text-xs text-muted">
          Nome
          <input name="name" required placeholder="Ex.: Tulipa" className={`${field} mt-1 block w-40 text-ink`} />
        </label>
        <label className="block text-xs text-muted">
          Acréscimo por flor (R$)
          <input name="extra_price" inputMode="decimal" defaultValue="0,00" className={`${field} mt-1 block w-28 text-ink`} />
        </label>
        <label className="block text-xs text-muted">
          Alerta abaixo de
          <input name="low_stock_threshold" type="number" min={0} defaultValue={10} className={`${field} mt-1 block w-24 text-ink`} />
        </label>
        <label className="block text-xs text-muted">
          Ordem
          <input name="position" type="number" defaultValue={flowers.length + 1} className={`${field} mt-1 block w-20 text-ink`} />
        </label>
        <input type="hidden" name="active" value="on" />
        <button className="rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep">Adicionar</button>
      </form>
    </div>
  );
}
