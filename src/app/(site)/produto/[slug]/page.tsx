import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { FlowerArt } from "@/components/flower-art";
import { storeConfig } from "@/lib/config";
import { getProduct } from "@/lib/catalog";
import { formatPrice, installmentText } from "@/lib/format";
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
  const installments = installmentText(product.price_cents, storeConfig.maxInstallments);

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
        {installments && <p className="text-sm text-muted">{installments} no cartão</p>}
        <p className="mt-6 leading-relaxed text-muted">{product.description}</p>
        <ul className="mt-6 space-y-2 text-sm text-ink/80">
          <li>• Montado à mão no dia da entrega</li>
          <li>• Entrega agendada em São Paulo (manhã, tarde ou noite)</li>
          {product.same_day && (
            <li>• Entrega no mesmo dia para pedidos até {storeConfig.sameDayCutoffHour}h</li>
          )}
          <li>• Cartão com mensagem personalizada</li>
        </ul>
        <div className="mt-8">
          <AddToCart product={product} />
        </div>
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
