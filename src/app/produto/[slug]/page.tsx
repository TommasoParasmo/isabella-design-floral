import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowerArt } from "@/components/flower-art";
import { getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return { title: product?.name ?? "Produto", description: product?.description ?? undefined };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const soldOut = product.stock <= 0;

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-16">
      <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl bg-blush">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <FlowerArt seed={product.slug} className="h-full w-full" />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <Link href="/loja" className="text-xs tracking-[0.2em] text-muted uppercase hover:text-wine">
          ← Voltar para a loja
        </Link>
        <h1 className="mt-4 font-serif text-5xl text-ink">{product.name}</h1>
        <p className="mt-3 font-serif text-3xl text-wine">{formatPrice(product.price_cents)}</p>
        <p className="mt-6 leading-relaxed text-muted">{product.description}</p>
        <ul className="mt-6 space-y-2 text-sm text-ink/80">
          <li>• Montado à mão no dia da entrega</li>
          <li>• Entrega agendada em São Paulo (manhã, tarde ou noite)</li>
          <li>• Cartão com mensagem personalizada</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="rounded-full bg-wine px-8 py-3 text-sm text-cream disabled:opacity-50"
            title="Carrinho chega na próxima etapa"
          >
            {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
          </button>
          <a
            href={whatsappLink(`Olá, Isa! Tenho interesse no ${product.name}.`)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-wine px-8 py-3 text-sm text-wine hover:bg-wine hover:text-cream"
          >
            Pedir pelo WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
