const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(cents: number) {
  return brl.format(cents / 100);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

// O preço do plano é sempre mensal; a frequência é a das entregas.
export const frequencyLabel = {
  semanal: "por mês · entrega toda semana",
  quinzenal: "por mês · entrega a cada 15 dias",
  mensal: "por mês · uma entrega mensal",
} as const;

// O Mercado Pago cobra juros de quem parcela, então não mostramos o valor da
// parcela (ele seria maior que o preço dividido).
export function installmentText(cents: number, max: number) {
  if (max <= 1 || cents < 100 * max) return null;
  return `ou em até ${max}x no cartão, com juros`;
}

// "6 Rosa, 4 Margarida" a partir das flores gravadas no item do pedido.
export function flowerSummary(flowers: { name: string; quantity: number }[] | null | undefined) {
  if (!flowers?.length) return null;
  return flowers.map((f) => `${f.quantity} ${f.name}`).join(", ");
}
