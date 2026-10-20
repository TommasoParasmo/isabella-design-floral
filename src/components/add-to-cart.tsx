"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "./cart-provider";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const soldOut = product.stock <= 0;
  const max = Math.max(product.stock, 1);

  if (soldOut) {
    return (
      <button type="button" disabled className="rounded-full bg-wine px-8 py-3 text-sm text-cream opacity-50">
        Esgotado
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-rose-soft">
        <button
          type="button"
          className="px-4 py-3 text-wine"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <span className="w-6 text-center text-sm" aria-live="polite">{quantity}</span>
        <button
          type="button"
          className="px-4 py-3 text-wine"
          onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          add(
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.price_cents,
              imageUrl: product.image_url,
              sameDay: product.same_day,
            },
            quantity,
          );
          router.push("/carrinho");
        }}
        className="rounded-full bg-wine px-8 py-3 text-sm text-cream transition-colors hover:bg-wine-deep"
      >
        Adicionar ao carrinho
      </button>
    </div>
  );
}
