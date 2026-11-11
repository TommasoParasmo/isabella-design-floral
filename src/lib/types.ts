export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
  seasonal?: boolean;
  active_from?: string | null;
  active_until?: string | null;
  headline?: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price_cents: number;
  // Capa (a primeira de images). Usada nos cards, carrinho e pedidos.
  image_url: string | null;
  // Todas as fotos, na ordem da Isa. Pode vir vazio em cadastros antigos.
  images?: string[];
  stock: number;
  featured: boolean;
  same_day: boolean;
  // Buquê montável: quantas flores o cliente escolhe. Nulo = produto comum.
  flower_count: number | null;
  // Criação livre: a Isa monta com as flores da semana. Sem controle de estoque.
  made_to_order: boolean;
};

export type Flower = {
  id: string;
  slug: string;
  name: string;
  extra_price_cents: number;
  stock: number;
};

// Flores escolhidas para uma unidade de buquê.
export type FlowerChoice = { flowerId: string; name: string; quantity: number };

export type SubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  frequency: "semanal" | "quinzenal" | "mensal";
  price_cents: number;
  image_url: string | null;
  perks: string[];
  // buque: sem vaso. arranjo: com vaso. Nulo nos planos antigos.
  kind: "buque" | "arranjo" | null;
  size: "pequeno" | "medio" | "grande" | null;
};

export type Workshop = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  starts_at: string;
  duration_minutes: number;
  location: string;
  price_cents: number;
  capacity: number;
  image_url: string | null;
  images?: string[];
  includes: string[];
  seats_left: number;
};
