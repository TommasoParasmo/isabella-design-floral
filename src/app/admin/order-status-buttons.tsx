"use client";

import { useTransition } from "react";
import { nextStatusFor, statusLabels } from "./status";
import { cancelOrder, updateOrderStatus } from "./actions";

export function OrderStatusButtons({
  orderId,
  status,
  fulfillment,
  allowCancel = false,
}: {
  orderId: string;
  status: string;
  fulfillment: string;
  allowCancel?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const next = nextStatusFor(status, fulfillment);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {next && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => updateOrderStatus(orderId, next))}
          className="rounded-full bg-wine px-5 py-2 text-xs text-cream hover:bg-wine-deep disabled:opacity-50"
        >
          Marcar como {statusLabels[next].toLowerCase()}
        </button>
      )}
      {allowCancel && status !== "cancelado" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Cancelar este pedido? Se já estava pago, os itens voltam ao estoque. O estorno no Mercado Pago é feito por lá.")) {
              startTransition(() => cancelOrder(orderId));
            }
          }}
          className="rounded-full border border-wine px-5 py-2 text-xs text-wine hover:bg-blush disabled:opacity-50"
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
