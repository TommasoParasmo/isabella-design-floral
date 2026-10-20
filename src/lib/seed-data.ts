// Espelho de supabase/seed.sql. Usado enquanto o Supabase não está configurado,
// para que o site funcione em desenvolvimento e em prévias.
import type { DeliverySlot } from "./delivery";
import type { Category, Product, SubscriptionPlan, Workshop } from "./types";

export const seedCategories: Category[] = [
  { id: "c1", slug: "buques", name: "Buquês", description: "Buquês assinados, montados à mão no dia da entrega.", position: 1 },
  { id: "c2", slug: "arranjos", name: "Arranjos", description: "Arranjos em vasos e cachepôs para mesa e decoração.", position: 2 },
  { id: "c3", slug: "box", name: "Flower Box", description: "Caixas com flores frescas, prontas para presentear.", position: 3 },
  { id: "c0", slug: "natal", name: "Natal", description: "Guirlandas, centros de mesa e arranjos para as festas.", position: 0, seasonal: true, active_from: "2026-11-01", active_until: "2026-12-25", headline: "Coleção de Natal" },
  { id: "c4", slug: "presentes", name: "Presentes", description: "Complementos para acompanhar as flores.", position: 4 },
];

const p = (
  id: string,
  slug: string,
  name: string,
  description: string,
  category_id: string,
  price_cents: number,
  stock: number,
  featured = false,
  same_day = true,
): Product => ({ id, slug, name, description, category_id, price_cents, stock, featured, same_day, image_url: null });

export const seedProducts: Product[] = [
  p("p1", "buque-bordo", "Buquê Bordô", "Rosas colombianas em tons de vinho com folhagens de eucalipto.", "c1", 28900, 8, true),
  p("p2", "buque-rose-antique", "Buquê Rosé Antique", "Rosas cor de chá, lisianthus e astilbe em papel de seda.", "c1", 24900, 10, true),
  p("p3", "buque-campestre", "Buquê Campestre", "Mix de flores da estação com toque silvestre.", "c1", 18900, 12),
  p("p4", "arranjo-jardim-ingles", "Arranjo Jardim Inglês", "Peônias, rosas spray e hortênsias em vaso de cerâmica.", "c2", 34900, 5, true),
  p("p5", "arranjo-orquidea", "Orquídea Phalaenopsis", "Orquídea dupla em cachepô de cimento queimado.", "c2", 21900, 6, false, false),
  p("p6", "box-paixao", "Flower Box Paixão", "Caixa redonda com 12 rosas vermelhas.", "c3", 26900, 7, true),
  p("p7", "box-delicada", "Flower Box Delicada", "Caixa com rosas rosé, mini rosas e gipsófila.", "c3", 22900, 9),
  p("p9", "guirlanda-bordo", "Guirlanda Bordô", "Guirlanda de pinheiro natural com rosas secas e fita de veludo vinho.", "c0", 32900, 10, false, false),
  p("p10", "centro-de-mesa-natal", "Centro de Mesa Noite Feliz", "Arranjo baixo com rosas, pinhas e velas para a ceia.", "c0", 38900, 8, false, false),
  p("p11", "box-natal", "Flower Box Natal", "Caixa com rosas vermelhas, eucalipto e ramos de pinheiro.", "c0", 27900, 12),
  p("p8", "vela-aromatica", "Vela Aromática Flor de Figo", "Vela de soja 180g para acompanhar o presente.", "c4", 7900, 15),
];

export const seedPlans: SubscriptionPlan[] = [
  { id: "s1", slug: "essencial", name: "Essencial", description: "Um arranjo fresco por mês para deixar a casa mais viva.", frequency: "mensal", price_cents: 14900, image_url: null, perks: ["1 arranjo por mês", "Flores da estação", "Entrega grátis em SP"] },
  { id: "s2", slug: "jardim", name: "Jardim", description: "Flores a cada 15 dias, com curadoria da Isa.", frequency: "quinzenal", price_cents: 26900, image_url: null, perks: ["2 arranjos por mês", "Curadoria exclusiva", "Entrega grátis em SP", "10% off na loja"] },
  { id: "s3", slug: "atelie", name: "Ateliê", description: "Toda semana um arranjo novo, para casa ou escritório.", frequency: "semanal", price_cents: 49900, image_url: null, perks: ["4 arranjos por mês", "Vaso de presente na adesão", "Entrega grátis em SP", "15% off em workshops"] },
];

export const seedWorkshops: Workshop[] = [
  { id: "w1", slug: "buque-de-noiva", title: "Buquê de Noiva", description: "Aprenda a técnica espiral e monte seu próprio buquê com flores nobres.", starts_at: "2026-11-14T14:00:00-03:00", duration_minutes: 180, location: "Ateliê Isabella Parasmo", price_cents: 39000, capacity: 10, image_url: null, includes: ["Todas as flores e materiais", "Café da tarde", "Certificado"], seats_left: 10 },
  { id: "w2", slug: "arranjos-de-natal", title: "Arranjos de Natal", description: "Guirlanda e centro de mesa natalino com folhagens e flores secas.", starts_at: "2026-12-05T10:00:00-03:00", duration_minutes: 240, location: "Ateliê Isabella Parasmo", price_cents: 45000, capacity: 12, image_url: null, includes: ["Todos os materiais", "Brunch", "Peças para levar para casa"], seats_left: 12 },
];

export const seedDeliverySlots: DeliverySlot[] = [
  { id: "d1", label: "Manhã (9h às 12h)", starts_at: "09:00:00", ends_at: "12:00:00", fee_cents: 2500 },
  { id: "d2", label: "Tarde (13h às 17h)", starts_at: "13:00:00", ends_at: "17:00:00", fee_cents: 2500 },
  { id: "d3", label: "Noite (18h às 20h)", starts_at: "18:00:00", ends_at: "20:00:00", fee_cents: 3500 },
];
