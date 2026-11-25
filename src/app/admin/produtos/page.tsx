import Link from "next/link";
import { FlowerArt } from "@/components/flower-art";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

type Row = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  flower_count: number | null;
  made_to_order: boolean;
  category_id: string | null;
};

export default async function ProdutosAdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name, price_cents, stock, image_url, active, featured, flower_count, made_to_order, category_id")
      .order("active", { ascending: false })
      .order("price_cents"),
    supabase.from("categories").select("id, slug, name").order("position"),
  ]);

  // Um bloco por categoria, na ordem da loja, para os vasos não se misturarem aos arranjos.
  const rows = (products ?? []) as Row[];
  const groups = [
    ...(categories ?? []).map((c) => ({ key: c.id, slug: c.slug, title: c.name, items: rows.filter((p) => p.category_id === c.id) })),
    { key: "sem", slug: "", title: "Sem categoria", items: rows.filter((p) => !p.category_id || !categories?.some((c) => c.id === p.category_id)) },
  ].filter((g) => g.items.length > 0 || g.slug === "vasos");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">Produtos</h1>
        <div className="flex gap-2">
          {categories?.some((c) => c.slug === "vasos") && (
            <Link href="/admin/produtos/novo?categoria=vasos" className="rounded-full border border-wine px-5 py-2 text-sm text-wine hover:bg-wine hover:text-cream">Novo vaso</Link>
          )}
          <Link href="/admin/produtos/novo" className="rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep">Novo produto</Link>
        </div>
      </div>
      {groups.map((group) => (
        <section key={group.key} className="mt-8">
          <h2 className="font-serif text-2xl text-wine">{group.title}</h2>
          {group.items.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum produto ainda. Use o botão “Novo vaso” para cadastrar o primeiro.</p>
          ) : (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}`} className={`flex gap-4 rounded-2xl border border-rose-soft p-3 hover:border-wine ${p.active ? "" : "opacity-50"}`}>
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-blush">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FlowerArt seed={p.slug} className="h-full w-full" />
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted">{p.price_cents > 0 ? formatPrice(p.price_cents) : "Sob consulta"} · {p.made_to_order ? "Criação livre" : p.flower_count ? `${p.flower_count} flores à escolha` : `${p.stock} em estoque`}</p>
                      <p className="mt-1 text-xs text-muted">{!p.active ? "Oculto" : p.featured ? "Destaque" : ""}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
