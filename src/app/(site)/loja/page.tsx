import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { getCategories, getProducts } from "@/lib/catalog";
import { storeConfig } from "@/lib/config";
import { isSameDayOpen } from "@/lib/delivery";

export const metadata: Metadata = { title: "Loja" };

export default async function LojaPage({ searchParams }: { searchParams: Promise<{ categoria?: string; hoje?: string }> }) {
  const { categoria, hoje } = await searchParams;
  const onlySameDay = hoje === "1";
  const [categories, products] = await Promise.all([getCategories(), getProducts(categoria, onlySameDay)]);
  const sameDayOpen = isSameDayOpen();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {onlySameDay ? (
        <SectionTitle
          eyebrow="para hoje"
          title="Entrega hoje"
          intro={
            sameDayOpen
              ? `Peças que saem hoje mesmo para pedidos feitos até ${storeConfig.sameDayCutoffHour}h.`
              : `Os pedidos para hoje encerraram às ${storeConfig.sameDayCutoffHour}h. Estas peças podem ser agendadas a partir de amanhã.`
          }
        />
      ) : (
        <SectionTitle eyebrow="feito à mão" title="Loja" intro="Todos os pedidos podem ser agendados para o dia e período que você preferir." />
      )}

      <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Categorias">
        <FilterLink href="/loja" active={!categoria && !onlySameDay}>Todos</FilterLink>
        <FilterLink href="/loja?hoje=1" active={onlySameDay}>Entrega hoje</FilterLink>
        {categories.map((c) => (
          <FilterLink key={c.id} href={`/loja?categoria=${c.slug}`} active={categoria === c.slug}>
            {c.name}
          </FilterLink>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted">Nenhum produto nesta categoria por enquanto.</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-5 py-2 text-sm transition-colors ${
        active ? "border-wine bg-wine text-cream" : "border-rose-soft text-ink/80 hover:border-wine hover:text-wine"
      }`}
    >
      {children}
    </Link>
  );
}
