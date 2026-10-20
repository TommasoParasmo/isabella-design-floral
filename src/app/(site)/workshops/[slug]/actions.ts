"use server";

import { z } from "zod";
import { createPreference } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { customerSchema } from "@/lib/validation";

const schema = z.object({
  workshopSlug: z.string(),
  seats: z.number().int().min(1).max(4),
  customer: customerSchema,
});

export async function registerForWorkshop(
  input: z.input<typeof schema>,
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.MP_ACCESS_TOKEN) {
    return { ok: false, error: "As inscrições online ainda estão sendo configuradas. Fale com a Isa pelo WhatsApp." };
  }

  const supabase = createAdminClient();
  const { data: workshop } = await supabase
    .from("workshops")
    .select("id, title, price_cents")
    .eq("slug", data.workshopSlug)
    .maybeSingle();
  if (!workshop) return { ok: false, error: "Workshop não encontrado." };

  const { data: registrationId, error } = await supabase.rpc("reserve_workshop_seats", {
    p_workshop_id: workshop.id,
    p_seats: data.seats,
    p_name: data.customer.name,
    p_email: data.customer.email,
    p_phone: data.customer.phone,
    p_cpf: data.customer.cpf,
  });
  if (error) {
    return { ok: false, error: error.message.includes("vagas") ? "Não há mais vagas suficientes nesta turma." : "Este workshop não está mais disponível." };
  }

  const total = workshop.price_cents * data.seats;
  await supabase.from("workshop_registrations").update({ total_cents: total }).eq("id", registrationId);

  const preference = await createPreference({
    externalReference: `ws:${registrationId}`,
    returnPath: "/workshops/obrigado",
    items: [{ id: workshop.id, title: `Workshop ${workshop.title}`, quantity: data.seats, unit_price_cents: workshop.price_cents }],
    payer: { name: data.customer.name, email: data.customer.email },
  });
  await supabase.from("workshop_registrations").update({ mp_preference_id: preference.id }).eq("id", registrationId);

  return { ok: true, redirectUrl: preference.init_point };
}
