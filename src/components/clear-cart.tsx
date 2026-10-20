"use client";

import { useEffect } from "react";
import { useCart } from "./cart-provider";

// Esvazia o carrinho quando o cliente volta do pagamento.
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
