import { requireAdmin } from "@/lib/admin";
import { nowInSaoPaulo } from "@/lib/delivery";
import { discounted, isRunning, PROMOTION_FIELDS, type Promotion } from "@/lib/promotions";
import { formatPrice } from "@/lib/format";
import { createPromotion, deletePromotion, setPromotionActive } from "./actions";

const field = "rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm outline-none focus:border-wine";
const shortDate = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

type Named = { id: string; name: string };

function status(p: Promotion, today: string) {
  if (!p.active) return { label: "Desligada", tone: "bg-ink/10 text-muted" };
  if (p.ends_on < today) return { label: "Encerrada", tone: "bg-ink/10 text-muted" };
  if (p.starts_on > today) return { label: `Começa ${shortDate(p.starts_on)}`, tone: "bg-blush text-wine" };
  return { label: "Valendo agora", tone: "bg-wine text-cream" };
}

export default async function PromocoesPage() {
  const { supabase } = await requireAdmin();
  const today = nowInSaoPaulo().date;
  const [{ data: promos, error }, { data: categories }, { data: products }, { data: workshops }] = await Promise.all([
    supabase.from("promotions").select(PROMOTION_FIELDS).order("starts_on", { ascending: false }).order("created_at"),
    supabase.from("categories").select("id, name").order("position"),
    supabase.from("products").select("id, name, price_cents, active").order("name"),
    supabase.from("workshops").select("id, title, starts_at, price_cents").eq("active", true).gte("starts_at", new Date().toISOString()).order("starts_at"),
  ]);
  const list = (promos ?? []) as Promotion[];
  // Só dá para criar desconto em produto à venda e com preço.
  const pricedProducts = products?.filter((p) => p.active && p.price_cents > 0);
  const name = (rows: Named[] | null, id: string | null) => rows?.find((r) => r.id === id)?.name ?? "—";
  const workshopName = (id: string | null) => workshops?.find((w) => w.id === id)?.title ?? "Workshop";

  function appliesTo(p: Promotion) {
    if (p.target === "categoria") return `Categoria ${name(categories, p.category_id)}`;
    if (p.target === "produto") {
      const product = products?.find((x) => x.id === p.product_id);
      return product && product.price_cents <= 0 ? `${product.name} (sob consulta, o desconto não muda o preço)` : name(products, p.product_id);
    }
    if (p.target === "workshops") return "Todos os workshops";
    return workshopName(p.workshop_id);
  }

  // Exemplo de preço para a Isa conferir o desconto.
  function example(p: Promotion) {
    const price =
      p.target === "produto" ? products?.find((x) => x.id === p.product_id)?.price_cents
      : p.target === "workshop" ? workshops?.find((w) => w.id === p.workshop_id)?.price_cents
      : p.target === "workshops" ? workshops?.[0]?.price_cents
      : undefined;
    return price ? `${formatPrice(price)} → ${formatPrice(discounted(price, p.percent_off))}` : null;
  }

  return (
    <div>
      <h1 className="font-serif text-4xl">Promoções</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Cada promoção dá um desconto em % numa categoria, num produto ou nos workshops. Ela só vale entre as datas de
        início e fim (o último dia conta inteiro) e some sozinha depois. Use o botão para ligar ou desligar na hora.
        No site, o preço antigo aparece riscado ao lado do novo, e o checkout já cobra com desconto.
      </p>

      {error && (
        <p className="mt-6 rounded-2xl border border-wine p-4 text-sm text-wine">
          Não foi possível carregar as promoções ({error.message}).
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {list.map((p) => {
          const s = status(p, today);
          const ex = example(p);
          return (
            <li key={p.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-rose-soft p-4 ${isRunning(p, today) ? "" : "opacity-70"}`}>
              <div className="min-w-48 flex-1">
                <p className="font-medium">
                  {p.name} <span className="ml-1 font-serif text-xl text-wine">-{p.percent_off}%</span>
                </p>
                <p className="text-xs text-muted">
                  {appliesTo(p)} · de {shortDate(p.starts_on)} a {shortDate(p.ends_on)}
                  {ex && <> · ex.: {ex}</>}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${s.tone}`}>{s.label}</span>
              <form action={setPromotionActive.bind(null, p.id, !p.active)}>
                <button
                  className={
                    p.active
                      ? "rounded-full border border-wine px-5 py-2 text-sm text-wine hover:bg-wine hover:text-cream"
                      : "rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep"
                  }
                >
                  {p.active ? "Desligar" : "Ligar"}
                </button>
              </form>
              <form action={deletePromotion.bind(null, p.id)}>
                <button className="text-xs text-muted underline hover:text-wine">Apagar</button>
              </form>
            </li>
          );
        })}
        {list.length === 0 && !error && <li className="text-sm text-muted">Nenhuma promoção cadastrada.</li>}
      </ul>

      <form action={createPromotion} className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-rose-soft bg-blush/50 p-4">
        <h2 className="w-full font-serif text-2xl">Nova promoção</h2>
        <label className="block text-xs text-muted">
          Nome
          <input name="name" required placeholder="Ex.: Natal · Buquês" className={`${field} mt-1 block w-52 text-ink`} />
        </label>
        <label className="block text-xs text-muted">
          Desconto (%)
          <input name="percent_off" type="number" min={1} max={90} required defaultValue={10} className={`${field} mt-1 block w-24 text-ink`} />
        </label>
        <label className="block text-xs text-muted">
          Vale para
          <select name="applies_to" required defaultValue="" className={`${field} mt-1 block w-64 text-ink`}>
            <option value="" disabled>Escolha…</option>
            <optgroup label="Categorias">
              {categories?.map((c) => <option key={c.id} value={`categoria:${c.id}`}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Workshops">
              <option value="workshops">Todos os workshops</option>
              {workshops?.map((w) => (
                <option key={w.id} value={`workshop:${w.id}`}>
                  {w.title} · {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(w.starts_at))}
                </option>
              ))}
            </optgroup>
            <optgroup label="Um produto">
              {pricedProducts?.map((p) => <option key={p.id} value={`produto:${p.id}`}>{p.name}</option>)}
            </optgroup>
          </select>
        </label>
        <label className="block text-xs text-muted">
          Começa em
          <input name="starts_on" type="date" required defaultValue={today} className={`${field} mt-1 block text-ink`} />
        </label>
        <label className="block text-xs text-muted">
          Termina em
          <input name="ends_on" type="date" required defaultValue={today} className={`${field} mt-1 block text-ink`} />
        </label>
        <button className="rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep">Criar promoção</button>
      </form>
    </div>
  );
}
