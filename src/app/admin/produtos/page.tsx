import Link from "next/link";
import { FlowerArt } from "@/components/flower-art";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export default async function ProdutosAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price_cents, stock, image_url, active, featured")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl">Produtos</h1>
        <Link href="/admin/produtos/novo" className="rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep">Novo produto</Link>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
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
                <p className="text-muted">{formatPrice(p.price_cents)} · {p.stock} em estoque</p>
                <p className="mt-1 text-xs text-muted">{!p.active ? "Oculto" : p.featured ? "Destaque" : ""}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
