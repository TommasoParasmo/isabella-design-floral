"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { FlowerArt } from "@/components/flower-art";
import { formatPrice } from "@/lib/format";

export default function CarrinhoPage() {
  const { items, subtotalCents, setQuantity, remove } = useCart();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-serif text-5xl">Seu carrinho</h1>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted">Seu carrinho está vazio.</p>
          <Link href="/loja" className="mt-6 inline-block rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep">
            Ver a loja
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-12 divide-y divide-rose-soft border-y border-rose-soft">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-5">
                <Link href={`/produto/${item.slug}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-t-[999px] rounded-b-xl bg-blush">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FlowerArt seed={item.slug} className="h-full w-full" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/produto/${item.slug}`} className="font-serif text-xl hover:text-wine">{item.name}</Link>
                  <p className="text-sm text-muted">{formatPrice(item.priceCents)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-rose-soft text-sm">
                      <button type="button" className="px-3 py-1 text-wine" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Diminuir">−</button>
                      <span className="w-5 text-center">{item.quantity}</span>
                      <button type="button" className="px-3 py-1 text-wine" onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Aumentar">+</button>
                    </div>
                    <button type="button" onClick={() => remove(item.productId)} className="text-xs text-muted underline hover:text-wine">
                      Remover
                    </button>
                  </div>
                </div>
                <p className="font-serif text-xl text-wine">{formatPrice(item.priceCents * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-end gap-4">
            <p className="text-lg">
              Subtotal <span className="ml-2 font-serif text-3xl text-wine">{formatPrice(subtotalCents)}</span>
            </p>
            <p className="text-xs text-muted">Entrega e agendamento na próxima etapa.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/loja" className="rounded-full border border-wine px-7 py-3 text-sm text-wine hover:bg-blush">
                Continuar comprando
              </Link>
              <Link href="/checkout" className="rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep">
                Finalizar pedido
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
