import Link from "next/link";
import { FlowerArt } from "@/components/flower-art";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { getActiveCollection, getCategories, getFeaturedProducts, getPlans, getUpcomingWorkshops } from "@/lib/catalog";
import { formatDateTime, formatPrice, frequencyLabel } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

export const revalidate = 60;

export default async function Home() {
  const [collection, featured, categories, plans, workshops] = await Promise.all([
    getActiveCollection(),
    getFeaturedProducts(),
    getCategories(),
    getPlans(),
    getUpcomingWorkshops(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="stripes absolute inset-y-0 right-0 hidden w-1/3 opacity-25 md:block" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="font-script text-4xl text-rose sm:text-5xl">flores que contam histórias</p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Design floral autoral em São Paulo
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-rose/90">
              Buquês e arranjos montados à mão, com entrega agendada no dia e horário que você escolher.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/loja" className="rounded-full bg-rose px-7 py-3 text-sm font-medium text-wine-deep transition-colors hover:bg-cream">
                Ver a loja
              </Link>
              <Link href="/assinaturas" className="rounded-full border border-rose/60 px-7 py-3 text-sm text-cream transition-colors hover:bg-cream/10">
                Assinatura floral
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl border-[10px] border-rose/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/arranjo-bordo.jpg" alt="Arranjo de celósias vermelhas e boca-de-leão em vaso branco" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Coleção sazonal (aparece só dentro das datas cadastradas) */}
      {collection && collection.products.length > 0 && (
        <section className="border-b border-rose-soft bg-blush/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-script text-3xl text-wine/80">edição limitada</p>
                <h2 className="mt-1 font-serif text-4xl sm:text-5xl">{collection.category.headline ?? collection.category.name}</h2>
                <p className="mt-2 max-w-md text-sm text-muted">{collection.category.description}</p>
              </div>
              <Link href={`/loja?categoria=${collection.category.slug}`} className="rounded-full border border-wine px-6 py-2.5 text-sm text-wine hover:bg-wine hover:text-cream">
                Ver a coleção
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {collection.products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="os queridinhos" title="Mais pedidos" intro="Uma seleção da Isa com as flores mais bonitas da semana." />
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/loja" className="text-sm tracking-[0.2em] text-wine uppercase underline-offset-8 hover:underline">
            Ver todos os produtos
          </Link>
        </div>
      </section>

      {/* Categorias */}
      <section className="bg-blush py-16">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 px-4 sm:px-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/loja?categoria=${category.slug}`}
              className="group w-[calc(50%-0.5rem)] rounded-2xl border border-rose-soft bg-cream p-6 text-center transition-colors hover:border-wine md:w-64"
            >
              <h3 className="font-serif text-2xl text-wine">{category.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="simples assim" title="Pedido agendado" />
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            ["Escolha", "Navegue pela loja e escolha o buquê ou arranjo ideal."],
            ["Agende", "Defina o dia, o período de entrega e escreva o cartão."],
            ["Receba", "A Isa monta tudo no dia, com flores frescas, e entrega em São Paulo."],
          ].map(([title, text], i) => (
            <li key={title} className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wine font-serif text-2xl text-cream">
                {i + 1}
              </span>
              <h3 className="mt-4 font-serif text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Assinaturas */}
      <section className="bg-wine-deep py-20 text-cream">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-script text-3xl text-rose">flores toda semana</p>
            <h2 className="mt-1 font-serif text-4xl sm:text-5xl">Assinaturas florais</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-3xl border border-rose/25 bg-wine p-8">
                <h3 className="font-serif text-3xl">{plan.name}</h3>
                <p className="mt-2 text-sm text-rose/85">{plan.description}</p>
                <p className="mt-6 font-serif text-4xl text-rose">
                  {formatPrice(plan.price_cents)}
                  <span className="ml-1 font-sans text-xs text-rose/70">{frequencyLabel[plan.frequency]}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/assinaturas" className="rounded-full bg-rose px-7 py-3 text-sm font-medium text-wine-deep hover:bg-cream">
              Conhecer os planos
            </Link>
          </div>
        </div>
      </section>

      {/* Workshops */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="aprenda com a Isa" title="Workshops" intro="Encontros no ateliê para aprender técnicas de design floral e levar sua criação para casa." />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {workshops.map((w) => (
            <Link key={w.id} href={`/workshops/${w.slug}`} className="group flex gap-5 rounded-3xl border border-rose-soft bg-cream p-5 transition-colors hover:border-wine">
              <div className="h-28 w-24 shrink-0 overflow-hidden rounded-t-[999px] rounded-b-xl">
                {w.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FlowerArt seed={w.slug} className="h-full w-full" />
                )}
              </div>
              <div>
                <p className="text-xs tracking-wider text-muted uppercase">{formatDateTime(w.starts_at)}</p>
                <h3 className="mt-1 font-serif text-2xl group-hover:text-wine">{w.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {formatPrice(w.price_cents)} · {w.seats_left > 0 ? `${w.seats_left} vagas` : "Esgotado"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="scroll-mt-24 bg-blush">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-[999px] rounded-b-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fotos/buque-hortensias.jpg" alt="Buquê de hortênsias azuis e verdes montado pela Isa" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-script text-3xl text-wine/80">muito prazer</p>
            <h2 className="mt-1 font-serif text-4xl sm:text-5xl">Isabella Parasmo</h2>
            <p className="mt-5 leading-relaxed text-muted">
              Designer floral apaixonada por cores profundas e composições delicadas. Cada peça é criada à mão no
              ateliê, com flores selecionadas no dia, para transformar datas especiais em memórias.
            </p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-block rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep"
            >
              Falar com a Isa
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
