"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data");

const schema = z
  .object({
    name: z.string().trim().min(2, "Dê um nome à promoção").max(80),
    percent_off: z.coerce.number().int().min(1).max(90),
    // "categoria:<id>", "produto:<id>", "workshop:<id>" ou "workshops"
    applies_to: z.string().regex(/^(workshops|(categoria|produto|workshop):[0-9a-f-]{36})$/, "Escolha onde vale o desconto"),
    starts_on: date,
    ends_on: date,
  })
  .refine((d) => d.ends_on >= d.starts_on, { message: "A data final precisa ser depois do início" });

function refreshSite() {
  revalidatePath("/admin/promocoes");
  revalidatePath("/", "layout");
}

export async function createPromotion(formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = schema.parse(Object.fromEntries(formData));
  const [target, id] = data.applies_to.split(":");
  const { error } = await supabase.from("promotions").insert({
    name: data.name,
    percent_off: data.percent_off,
    target,
    category_id: target === "categoria" ? id : null,
    product_id: target === "produto" ? id : null,
    workshop_id: target === "workshop" ? id : null,
    starts_on: data.starts_on,
    ends_on: data.ends_on,
  });
  if (error) throw error;
  refreshSite();
}

export async function setPromotionActive(id: string, active: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("promotions").update({ active }).eq("id", id);
  if (error) throw error;
  refreshSite();
}

export async function deletePromotion(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
  refreshSite();
}
