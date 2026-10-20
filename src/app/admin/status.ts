// Compartilhado entre servidor e cliente (sem "server-only").
export const statusLabels: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_preparo: "Em preparo",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  retirado: "Retirado",
  cancelado: "Cancelado",
};

export function nextStatusFor(status: string, fulfillment: string) {
  if (status === "pago") return "em_preparo" as const;
  if (status === "em_preparo") return fulfillment === "entrega" ? ("saiu_para_entrega" as const) : ("retirado" as const);
  if (status === "saiu_para_entrega") return "entregue" as const;
  return null;
}
