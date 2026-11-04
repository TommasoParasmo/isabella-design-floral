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
  { id: "s1", slug: "essencial", name: "Essencial", description: "Um arranjo fresco por mês para deixar a casa mais viva.", frequency: "mensal", price_cents: 14900, image_url: "/fotos/arranjo-sol.jpg", perks: ["1 arranjo por mês", "Flores da estação", "Entrega grátis em SP"] },
  { id: "s2", slug: "jardim", name: "Jardim", description: "Flores a cada 15 dias, com curadoria da Isa.", frequency: "quinzenal", price_cents: 26900, image_url: "/fotos/arranjo-lirios.jpg", perks: ["2 arranjos por mês", "Curadoria exclusiva", "Entrega grátis em SP", "10% off na loja"] },
  { id: "s3", slug: "atelie", name: "Ateliê", description: "Toda semana um arranjo novo, para casa ou escritório.", frequency: "semanal", price_cents: 49900, image_url: "/fotos/arranjo-bordo.jpg", perks: ["4 arranjos por mês", "Vaso de presente na adesão", "Entrega grátis em SP", "15% off em workshops"] },
];

export const seedWorkshops: Workshop[] = [
  { id: "w1", slug: "buque-de-noiva", title: "Buquê de Noiva", description: "Aprenda a técnica espiral e monte seu próprio buquê com flores nobres.", starts_at: "2026-11-14T14:00:00-03:00", duration_minutes: 180, location: "Ateliê Isabella Parasmo", price_cents: 39000, capacity: 10, image_url: "/fotos/workshop-mesa.jpg", includes: ["Todas as flores e materiais", "Café da tarde", "Certificado"], seats_left: 10 },
  { id: "w2", slug: "arranjos-de-natal", title: "Arranjos de Natal", description: "Guirlanda e centro de mesa natalino com folhagens e flores secas.", starts_at: "2026-12-05T10:00:00-03:00", duration_minutes: 240, location: "Ateliê Isabella Parasmo", price_cents: 45000, capacity: 12, image_url: "/fotos/workshop-mesa.jpg", includes: ["Todos os materiais", "Brunch", "Peças para levar para casa"], seats_left: 12 },
];

export const seedDeliverySlots: DeliverySlot[] = [
  { id: "d1", label: "Manhã (9h às 12h)", starts_at: "09:00:00", ends_at: "12:00:00", fee_cents: 2500 },
  { id: "d2", label: "Tarde (13h às 17h)", starts_at: "13:00:00", ends_at: "17:00:00", fee_cents: 2500 },
  { id: "d3", label: "Noite (18h às 20h)", starts_at: "18:00:00", ends_at: "20:00:00", fee_cents: 3500 },
];
