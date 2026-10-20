import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured } from "./supabase/server";
import type { DeliverySlot } from "./delivery";
import { seedCategories, seedDeliverySlots, seedPlans, seedProducts, seedWorkshops } from "./seed-data";
import type { Category, Product, SubscriptionPlan, Workshop } from "./types";

const PRODUCT_FIELDS = "id, slug, name, description, category_id, price_cents, image_url, stock, featured, same_day";

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return seedCategories;
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name, description, position")
    .order("position");
  if (error) throw error;
  return data;
}

export async function getProducts(categorySlug?: string, onlySameDay = false): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    const category = seedCategories.find((c) => c.slug === categorySlug);
    return seedProducts
      .filter((p) => !category || p.category_id === category.id)
      .filter((p) => !onlySameDay || (p.same_day && p.stock > 0));
  }
  let query = createPublicClient().from("products").select(PRODUCT_FIELDS).eq("active", true).order("name");
  if (onlySameDay) query = query.eq("same_day", true).gt("stock", 0);
  if (categorySlug) {
    const { data: category } = await createPublicClient()
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return seedProducts.filter((p) => p.featured);
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .eq("featured", true)
    .limit(4);
  if (error) throw error;
  return data;
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return seedProducts.find((p) => p.slug === slug) ?? null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  if (!isSupabaseConfigured()) return seedPlans;
  const { data, error } = await createPublicClient()
    .from("subscription_plans")
    .select("id, slug, name, description, frequency, price_cents, image_url, perks")
    .eq("active", true)
    .order("position");
  if (error) throw error;
  return data;
}

export async function getUpcomingWorkshops(): Promise<Workshop[]> {
  if (!isSupabaseConfigured()) {
    const now = Date.now();
    return seedWorkshops.filter((w) => new Date(w.starts_at).getTime() >= now);
  }
  const supabase = createPublicClient();
  const [{ data: workshops, error }, { data: availability, error: availabilityError }] = await Promise.all([
    supabase
      .from("workshops")
      .select("id, slug, title, description, starts_at, duration_minutes, location, price_cents, capacity, image_url, includes")
      .eq("active", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at"),
    supabase.rpc("workshop_availability") as unknown as Promise<{ data: { workshop_id: string; seats_left: number }[] | null; error: Error | null }>,
  ]);
  if (error) throw error;
  if (availabilityError) throw availabilityError;
  const seats = new Map((availability ?? []).map((a) => [a.workshop_id, a.seats_left]));
  return workshops.map((w) => ({ ...w, seats_left: seats.get(w.id) ?? w.capacity }));
}

export async function getDeliverySlots(): Promise<DeliverySlot[]> {
  if (!isSupabaseConfigured()) return seedDeliverySlots;
  const { data, error } = await createPublicClient()
    .from("delivery_slots")
    .select("id, label, starts_at, ends_at, fee_cents")
    .eq("active", true)
    .order("starts_at");
  if (error) throw error;
  return data;
}
