"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/carrinho" className="relative rounded-full p-2 text-wine" aria-label={`Carrinho, ${count} itens`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-wine px-1 text-[10px] text-cream">
          {count}
        </span>
      )}
    </Link>
  );
}
