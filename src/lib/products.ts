import type { Product } from "./types";

// Criação livre nunca esgota: a Isa monta com as flores que tiver na loja.
export function isAvailable(product: Pick<Product, "stock" | "made_to_order">) {
  return product.made_to_order || product.stock > 0;
}

// Quantas unidades o cliente pode pôr no carrinho de uma vez.
export function maxQuantity(product: Pick<Product, "stock" | "made_to_order">) {
  return product.made_to_order ? 10 : Math.max(product.stock, 1);
}

// Fotos de um produto ou workshop, com a capa primeiro.
export function photosOf(item: { image_url: string | null; images?: string[] | null }) {
  if (item.images?.length) return item.images;
  return item.image_url ? [item.image_url] : [];
}
