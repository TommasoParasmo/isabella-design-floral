// Espelho de supabase/seed.sql. Usado enquanto o Supabase não está configurado,
// para que o site funcione em desenvolvimento e em prévias.
import type { DeliverySlot } from "./delivery";
import type { Category, Flower, Product, SubscriptionPlan, Workshop } from "./types";

export const seedCategories: Category[] = [
  { id: "c1", slug: "buques", name: "Buquês", description: "Buquês assinados, montados à mão no dia da entrega.", position: 1 },
  { id: "c2", slug: "arranjos", name: "Arranjos", description: "Arranjos em vasos para mesa, casa e recepções.", position: 2 },
  { id: "c0", slug: "natal", name: "Natal", description: "Guirlandas, centros de mesa e arranjos para as festas.", position: 0, seasonal: true, active_from: "2026-11-01", active_until: "2026-12-25", headline: "Coleção de Natal" },
];

const bouquet = (id: string, slug: string, name: string, flower_count: number, price_cents: number, image: string): Product => ({
  id,
  slug,
  name,
  description: `Buquê com ${flower_count} flores que você escolhe, montado à mão pela Isa com papel e laço de cetim.`,
  category_id: "c1",
  price_cents,
  stock: 0,
  featured: true,
  same_day: true,
  image_url: `/fotos/${image}.jpg`,
  flower_count,
});

export const seedProducts: Product[] = [
  bouquet("p1", "buque-pequeno", "Buquê Pequeno", 10, 14900, "buque-doce-rosa"),
  bouquet("p2", "buque-medio", "Buquê Médio", 20, 24900, "buque-rose"),
  bouquet("p3", "buque-grande", "Buquê Grande", 30, 34900, "buque-jardim-bordo"),
];

export const seedFlowers: Flower[] = [
  { id: "f1", slug: "rosa", name: "Rosa", extra_price_cents: 0, stock: 60 },
  { id: "f2", slug: "margarida", name: "Margarida", extra_price_cents: 0, stock: 40 },
  { id: "f3", slug: "orquidea", name: "Orquídea", extra_price_cents: 0, stock: 12 },
  { id: "f4", slug: "lirio", name: "Lírio", extra_price_cents: 0, stock: 20 },
  { id: "f5", slug: "girassol", name: "Girassol", extra_price_cents: 0, stock: 0 },
  { id: "f6", slug: "cravo", name: "Cravo", extra_price_cents: 0, stock: 30 },
];

export const seedPlans: SubscriptionPlan[] = [
  { id: "s1", slug: "buque-pequeno-mensal", name: "Buquê Pequeno · Mensal", description: "8 a 12 hastes, ideal para vasos menores (20 cm de altura).", frequency: "mensal", price_cents: 14900, image_url: "/fotos/buque-colorido.jpg", perks: ["1 entrega por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "pequeno" },
  { id: "s2", slug: "buque-medio-mensal", name: "Buquê Médio · Mensal", description: "12 a 15 hastes, ideal para vasos médios (25 cm de altura).", frequency: "mensal", price_cents: 18900, image_url: "/fotos/buque-azul-campo.jpg", perks: ["1 entrega por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "medio" },
  { id: "s3", slug: "buque-grande-mensal", name: "Buquê Grande · Mensal", description: "18 a 25 hastes, ideal para vasos maiores (30 cm de altura).", frequency: "mensal", price_cents: 22900, image_url: "/fotos/buque-rosas-brancas.jpg", perks: ["1 entrega por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "grande" },
  { id: "s4", slug: "buque-pequeno-quinzenal", name: "Buquê Pequeno · Quinzenal", description: "8 a 12 hastes, ideal para vasos menores (20 cm de altura).", frequency: "quinzenal", price_cents: 27900, image_url: "/fotos/buque-colorido.jpg", perks: ["2 entregas por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "pequeno" },
  { id: "s5", slug: "buque-medio-quinzenal", name: "Buquê Médio · Quinzenal", description: "12 a 15 hastes, ideal para vasos médios (25 cm de altura).", frequency: "quinzenal", price_cents: 35900, image_url: "/fotos/buque-azul-campo.jpg", perks: ["2 entregas por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "medio" },
  { id: "s6", slug: "buque-grande-quinzenal", name: "Buquê Grande · Quinzenal", description: "18 a 25 hastes, ideal para vasos maiores (30 cm de altura).", frequency: "quinzenal", price_cents: 43900, image_url: "/fotos/buque-rosas-brancas.jpg", perks: ["2 entregas por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "grande" },
  { id: "s7", slug: "buque-pequeno-semanal", name: "Buquê Pequeno · Semanal", description: "8 a 12 hastes, ideal para vasos menores (20 cm de altura).", frequency: "semanal", price_cents: 46900, image_url: "/fotos/buque-colorido.jpg", perks: ["4 entregas por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "pequeno" },
  { id: "s8", slug: "buque-medio-semanal", name: "Buquê Médio · Semanal", description: "12 a 15 hastes, ideal para vasos médios (25 cm de altura).", frequency: "semanal", price_cents: 57900, image_url: "/fotos/buque-azul-campo.jpg", perks: ["4 entregas por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "medio" },
  { id: "s9", slug: "buque-grande-semanal", name: "Buquê Grande · Semanal", description: "18 a 25 hastes, ideal para vasos maiores (30 cm de altura).", frequency: "semanal", price_cents: 72900, image_url: "/fotos/buque-rosas-brancas.jpg", perks: ["4 entregas por mês", "Flores frescas da estação", "Não inclui vaso", "Entrega em SP (frete a combinar) ou retirada"], kind: "buque", size: "grande" },
  { id: "s10", slug: "arranjo-pequeno-mensal", name: "Arranjo Pequeno · Mensal", description: "8 a 12 hastes, ideal para vasos menores (20 cm de altura).", frequency: "mensal", price_cents: 18900, image_url: "/fotos/arranjo-vaso-ceramica.jpg", perks: ["1 entrega por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "pequeno" },
  { id: "s11", slug: "arranjo-medio-mensal", name: "Arranjo Médio · Mensal", description: "12 a 15 hastes, ideal para vasos médios (25 cm de altura).", frequency: "mensal", price_cents: 22900, image_url: "/fotos/arranjo-vaso-vidro.jpg", perks: ["1 entrega por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "medio" },
  { id: "s12", slug: "arranjo-grande-mensal", name: "Arranjo Grande · Mensal", description: "18 a 25 hastes, ideal para vasos maiores (30 cm de altura).", frequency: "mensal", price_cents: 26900, image_url: "/fotos/arranjo-caixa-rosas.jpg", perks: ["1 entrega por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "grande" },
  { id: "s13", slug: "arranjo-pequeno-quinzenal", name: "Arranjo Pequeno · Quinzenal", description: "8 a 12 hastes, ideal para vasos menores (20 cm de altura).", frequency: "quinzenal", price_cents: 35900, image_url: "/fotos/arranjo-vaso-ceramica.jpg", perks: ["2 entregas por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "pequeno" },
  { id: "s14", slug: "arranjo-medio-quinzenal", name: "Arranjo Médio · Quinzenal", description: "12 a 15 hastes, ideal para vasos médios (25 cm de altura).", frequency: "quinzenal", price_cents: 43900, image_url: "/fotos/arranjo-vaso-vidro.jpg", perks: ["2 entregas por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "medio" },
  { id: "s15", slug: "arranjo-grande-quinzenal", name: "Arranjo Grande · Quinzenal", description: "18 a 25 hastes, ideal para vasos maiores (30 cm de altura).", frequency: "quinzenal", price_cents: 51900, image_url: "/fotos/arranjo-caixa-rosas.jpg", perks: ["2 entregas por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "grande" },
  { id: "s16", slug: "arranjo-pequeno-semanal", name: "Arranjo Pequeno · Semanal", description: "8 a 12 hastes, ideal para vasos menores (20 cm de altura).", frequency: "semanal", price_cents: 56900, image_url: "/fotos/arranjo-vaso-ceramica.jpg", perks: ["4 entregas por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "pequeno" },
  { id: "s17", slug: "arranjo-medio-semanal", name: "Arranjo Médio · Semanal", description: "12 a 15 hastes, ideal para vasos médios (25 cm de altura).", frequency: "semanal", price_cents: 67900, image_url: "/fotos/arranjo-vaso-vidro.jpg", perks: ["4 entregas por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "medio" },
  { id: "s18", slug: "arranjo-grande-semanal", name: "Arranjo Grande · Semanal", description: "18 a 25 hastes, ideal para vasos maiores (30 cm de altura).", frequency: "semanal", price_cents: 82900, image_url: "/fotos/arranjo-caixa-rosas.jpg", perks: ["4 entregas por mês", "Flores frescas da estação", "Vaso incluso", "Entrega em SP (frete a combinar) ou retirada"], kind: "arranjo", size: "grande" },
];

export const seedWorkshops: Workshop[] = [
  { id: "w1", slug: "workshop-guirlanda-de-natal", title: "Guirlanda de Natal - Sábado", description: "Vamos aprender a montar uma guirlanda de Natal com flores naturais, com uma pausa para o coffee break. No final, você leva a sua guirlanda para casa.", starts_at: "2026-11-21T10:00:00-03:00", duration_minutes: 180, location: "Ateliê Isabella Parasmo", price_cents: 38000, capacity: 12, image_url: "/fotos/workshop-guirlanda-natal.jpg", includes: ["Todos os materiais", "Coffee break", "Sua guirlanda para levar para casa"], seats_left: 12 },
  { id: "w2", slug: "guirlanda-de-natal-domingo", title: "Guirlanda de Natal - Domingo", description: "Vamos aprender a montar uma guirlanda de Natal com flores naturais, com uma pausa para o coffee break. No final, você leva a sua guirlanda para casa.", starts_at: "2026-11-29T10:00:00-03:00", duration_minutes: 180, location: "Ateliê Isabella Parasmo", price_cents: 38000, capacity: 12, image_url: "/fotos/workshop-guirlanda-natal.jpg", includes: ["Todos os materiais", "Coffee break", "Sua guirlanda para levar para casa"], seats_left: 12 },
];

export const seedDeliverySlots: DeliverySlot[] = [
  { id: "d1", label: "Manhã (9h às 12h)", starts_at: "09:00:00", ends_at: "12:00:00", fee_cents: 2500 },
  { id: "d2", label: "Tarde (13h às 17h)", starts_at: "13:00:00", ends_at: "17:00:00", fee_cents: 2500 },
  { id: "d3", label: "Noite (18h às 20h)", starts_at: "18:00:00", ends_at: "20:00:00", fee_cents: 3500 },
];
