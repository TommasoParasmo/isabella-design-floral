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

export const frequencyLabel = {
  semanal: "por semana",
  quinzenal: "a cada 15 dias",
  mensal: "por mês",
} as const;
