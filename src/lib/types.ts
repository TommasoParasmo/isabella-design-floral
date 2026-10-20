export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price_cents: number;
  image_url: string | null;
  stock: number;
  featured: boolean;
};

export type SubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  frequency: "semanal" | "quinzenal" | "mensal";
  price_cents: number;
  image_url: string | null;
  perks: string[];
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
  includes: string[];
  seats_left: number;
};
