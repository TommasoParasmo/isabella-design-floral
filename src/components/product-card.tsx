import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { isSameDayOpen } from "@/lib/delivery";
import { formatPrice, installmentText } from "@/lib/format";
import type { Product } from "@/lib/types";
import { FlowerArt } from "./flower-art";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-blush">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <FlowerArt seed={product.slug} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        )}
        {!soldOut && product.same_day && isSameDayOpen() && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-cream/90 px-3 py-1 text-[10px] tracking-wider whitespace-nowrap text-wine uppercase">
            Entrega hoje
          </span>
        )}
        {soldOut && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 rounded-full bg-cream/90 px-3 py-1 text-xs tracking-wider text-wine uppercase">
            Esgotado
          </span>
        )}
      </div>
      <div className="mt-4 text-center">
        <h3 className="font-serif text-xl text-ink group-hover:text-wine">{product.name}</h3>
        <p className="mt-1 text-sm text-ink/80">{formatPrice(product.price_cents)}</p>
        {installmentText(product.price_cents, storeConfig.maxInstallments) && (
          <p className="text-xs text-muted">{installmentText(product.price_cents, storeConfig.maxInstallments)}</p>
        )}
      </div>
    </Link>
  );
}
