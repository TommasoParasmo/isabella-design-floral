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
  image_url: string | null;
  stock: number;
  featured: boolean;
  same_day: boolean;
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
