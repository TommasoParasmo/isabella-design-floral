import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { BuildBouquet } from "@/components/build-bouquet";
import { FlowerArt } from "@/components/flower-art";
import { PhotoGallery } from "@/components/photo-gallery";
import { storeConfig } from "@/lib/config";
import { getFlowers, getProduct } from "@/lib/catalog";
import { formatPrice, installmentText } from "@/lib/format";
import { photosOf } from "@/lib/products";
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
  const flowers = product.flower_count ? await getFlowers() : [];
  const photos = photosOf(product);
  const installments = installmentText(product.price_cents, storeConfig.maxInstallments);

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-16">
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} alt={product.name} frameClass="aspect-[4/5] rounded-t-[999px] rounded-b-3xl" />
      ) : (
        <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl bg-blush">
          <FlowerArt seed={product.slug} className="h-full w-full" />
        </div>
      )}
      <div className="flex flex-col justify-center">
        <Link href="/loja" className="text-xs tracking-[0.2em] text-muted uppercase hover:text-wine">
          ← Voltar para a loja
        </Link>
        <h1 className="mt-4 font-serif text-5xl text-ink">{product.name}</h1>
        <p className="mt-3 font-serif text-3xl text-wine">
          {product.flower_count && flowers.some((f) => f.extra_price_cents > 0) && <span className="mr-2 font-sans text-sm text-muted">a partir de</span>}
          {formatPrice(product.price_cents)}
        </p>
        {installments && <p className="text-sm text-muted">{installments} no cartão</p>}
        <p className="mt-6 leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
        <ul className="mt-6 space-y-2 text-sm text-ink/80">
          {product.flower_count && <li>• {product.flower_count} flores escolhidas por você</li>}
          {product.made_to_order && <li>• Você escolhe o tamanho, a Isa escolhe as flores frescas da semana</li>}
          <li>• Montado à mão no dia da entrega</li>
          <li>• Entrega agendada em São Paulo (manhã, tarde ou noite)</li>
          {product.same_day && (
            <li>• Entrega no mesmo dia para pedidos até {storeConfig.sameDayCutoffHour}h</li>
          )}
          <li>• Cartão com mensagem personalizada</li>
        </ul>
        <div className="mt-8">
          {product.flower_count ? <BuildBouquet product={product} flowers={flowers} /> : <AddToCart product={product} />}
        </div>
        {product.made_to_order && (
          <p className="mt-6 rounded-2xl bg-blush px-5 py-4 text-sm leading-relaxed text-ink/80">
            As flores e as cores dependem da disponibilidade da semana, então podem ocorrer variações sutis em relação à foto.
            Quer flores ou cores específicas?{" "}
            <a
              href={whatsappLink(`Olá, Isa! Gostaria de encomendar um ${product.name.replace(/ - Criação Livre$/i, "")} com flores específicas.`)}
              target="_blank"
              rel="noreferrer"
              className="text-wine underline underline-offset-4"
            >
              Encomende pelo WhatsApp
            </a>
            .
          </p>
        )}
        <a
          href={whatsappLink(`Olá, Isa! Tenho uma dúvida sobre o ${product.name}.`)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 self-start text-sm text-muted underline underline-offset-4 hover:text-wine"
        >
          Dúvidas? Fale com a Isa no WhatsApp
        </a>
      </div>
    </section>
  );
}
