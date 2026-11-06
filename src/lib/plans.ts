import type { SubscriptionPlan } from "./types";

// Textos do PDF "Assinatura Floral 2026" da Isa.
export const planKinds = [
  {
    kind: "buque",
    title: "Buquês",
    vase: "Assinaturas de buquês não incluem o vaso.",
    image: "/fotos/buque-rosas-brancas.jpg",
    imageAlt: "Buquê de rosas brancas, hortênsia azul e eucalipto",
  },
  {
    kind: "arranjo",
    title: "Arranjos em vasos",
    vase: "Assinaturas de arranjos incluem o vaso.",
    image: "/fotos/arranjo-vaso-vidro.jpg",
    imageAlt: "Arranjo de rosas salmão e flores lilás em vaso de vidro",
  },
] as const;

export const planFrequencies = [
  { frequency: "mensal", title: "Plano mensal", deliveries: "1 entrega por mês" },
  { frequency: "quinzenal", title: "Plano quinzenal", deliveries: "2 entregas por mês" },
  { frequency: "semanal", title: "Plano semanal", deliveries: "4 entregas por mês" },
] as const;

export const planSizes = [
  { size: "pequeno", title: "Pequeno", stems: "8 a 12 hastes", vase: "vasos menores (20\u00a0cm)" },
  { size: "medio", title: "Médio", stems: "12 a 15 hastes", vase: "vasos médios (25\u00a0cm)" },
  { size: "grande", title: "Grande", stems: "18 a 25 hastes", vase: "vasos maiores (30\u00a0cm)" },
] as const;

export const howItWorks = [
  "Você escolhe o plano",
  "Nós selecionamos flores frescas da estação",
  "Entregamos no seu endereço",
  "Entregas em São Paulo (frete a calcular) ou retirada",
];

export function findPlan(plans: SubscriptionPlan[], kind: string, frequency: string, size: string) {
  return plans.find((p) => p.kind === kind && p.frequency === frequency && p.size === size) ?? null;
}

export function cheapestPlan(plans: SubscriptionPlan[], kind: string) {
  return plans.filter((p) => p.kind === kind).sort((a, b) => a.price_cents - b.price_cents)[0] ?? null;
}
