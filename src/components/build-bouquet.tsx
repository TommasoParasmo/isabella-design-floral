"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Flower, Product } from "@/lib/types";
import { useCart } from "./cart-provider";
import { FlowerPicker, selectedCount, selectionExtraCents, selectionToChoices, type FlowerSelection } from "./flower-picker";

export function BuildBouquet({ product, flowers }: { product: Product; flowers: Flower[] }) {
  const { add } = useCart();
  const router = useRouter();
  const [selection, setSelection] = useState<FlowerSelection>({});
  const total = product.flower_count ?? 0;
  const complete = selectedCount(selection) === total;
  const price = product.price_cents + selectionExtraCents(flowers, selection);
  const available = flowers.reduce((n, f) => n + Math.max(f.stock, 0), 0) >= total;

  if (!available) {
    return (
      <button type="button" disabled className="rounded-full bg-wine px-8 py-3 text-sm text-cream opacity-50">
        Esgotado
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-rose-soft bg-cream p-5">
      <FlowerPicker flowers={flowers} total={total} value={selection} onChange={setSelection} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rose-soft pt-4">
        <p className="font-serif text-2xl text-wine">{formatPrice(price)}</p>
        <button
          type="button"
          disabled={!complete}
          onClick={() => {
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: price,
              imageUrl: product.image_url,
              sameDay: product.same_day,
              flowers: selectionToChoices(flowers, selection),
            });
            router.push("/carrinho");
          }}
          className="rounded-full bg-wine px-8 py-3 text-sm text-cream transition-colors hover:bg-wine-deep disabled:opacity-50"
        >
          {complete
            ? "Adicionar ao carrinho"
            : `Escolha mais ${total - selectedCount(selection)} ${total - selectedCount(selection) === 1 ? "flor" : "flores"}`}
        </button>
      </div>
    </div>
  );
}
