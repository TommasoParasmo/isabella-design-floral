"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

// "849" ou "849,90" ou "1.129" → centavos. Vazio vira nulo.
const money = z
  .string()
  .trim()
  .transform((v) => (v ? Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100) : null))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Valor inválido");

const clubePlanSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Dê um nome ao plano").max(80),
  deliveries: z.coerce.number().int().min(1).max(52),
  price: money.refine((v) => v !== null, "Informe o preço"),
  list_price: money,
  badge: z.string().trim().max(40).optional(),
  description: z.string().trim().max(600).optional(),
  position: z.coerce.number().int().min(0).max(99),
  active: z.literal("on").optional(),
});

function revalidateClube() {
  revalidatePath("/admin/assinaturas");
  revalidatePath("/clube-dos-desatentos");
  revalidatePath("/assinaturas");
}

export async function saveClubePlan(formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = clubePlanSchema.parse(Object.fromEntries(formData));
  const row = {
    name: data.name,
    deliveries: data.deliveries,
    price_cents: data.price!,
    list_price_cents: data.list_price,
    badge: data.badge || null,
    description: data.description || null,
    position: data.position,
    active: data.active === "on",
    updated_at: new Date().toISOString(),
  };
  const { error } = data.id
    ? await supabase.from("clube_plans").update(row).eq("id", data.id)
    : await supabase.from("clube_plans").insert(row);
  if (error) throw error;
  revalidateClube();
}
