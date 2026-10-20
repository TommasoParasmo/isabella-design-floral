"use server";

import { z } from "zod";
import { createPreapproval, createPreference } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { addressSchema, customerSchema } from "@/lib/validation";

const schema = z
  .object({
    planSlug: z.string(),
    kind: z.enum(["recorrente", "presente"]),
    giftMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]).optional(),
    giftRecipientName: z.string().trim().max(120).optional(),
    giftMessage: z.string().trim().max(400).optional(),
    preferredWeekday: z.number().int().min(1).max(6),
    customer: customerSchema,
    address: addressSchema,
  })
  .refine((d) => d.kind === "recorrente" || (d.giftMonths && d.giftRecipientName), {
    message: "Para presentear, escolha a duração e o nome de quem vai receber.",
  });

export type SubscribeInput = z.input<typeof schema>;

export async function subscribe(input: SubscribeInput): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.MP_ACCESS_TOKEN) {
    return { ok: false, error: "As assinaturas online ainda estão sendo configuradas. Fale com a Isa pelo WhatsApp." };
  }

  const supabase = createAdminClient();
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, name, price_cents")
    .eq("slug", data.planSlug)
    .eq("active", true)
    .maybeSingle();
  if (!plan) return { ok: false, error: "Plano não encontrado." };

  const total = data.kind === "presente" ? plan.price_cents * data.giftMonths! : plan.price_cents;

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({
      plan_id: plan.id,
      kind: data.kind,
      gift_months: data.kind === "presente" ? data.giftMonths : null,
      gift_recipient_name: data.giftRecipientName || null,
      gift_message: data.giftMessage || null,
      preferred_weekday: data.preferredWeekday,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      customer_cpf: data.customer.cpf,
      delivery_address: data.address,
      total_cents: total,
    })
    .select("id")
    .single();
  if (error) throw error;

  const ref = `sub:${sub.id}`;
  const returnPath = "/assinaturas/obrigado";

  if (data.kind === "recorrente") {
    const preapproval = await createPreapproval({
      externalReference: ref,
      reason: `Assinatura Floral ${plan.name} · Isabella Parasmo`,
      payerEmail: data.customer.email,
      amountCents: plan.price_cents,
      returnPath,
    });
    await supabase.from("subscriptions").update({ mp_preapproval_id: preapproval.id }).eq("id", sub.id);
    return { ok: true, redirectUrl: preapproval.init_point };
  }

  const preference = await createPreference({
    externalReference: ref,
    returnPath,
    items: [{ id: plan.id, title: `Assinatura ${plan.name} · ${data.giftMonths} meses (presente)`, quantity: 1, unit_price_cents: total }],
    payer: { name: data.customer.name, email: data.customer.email },
  });
  await supabase.from("subscriptions").update({ mp_preference_id: preference.id }).eq("id", sub.id);
  return { ok: true, redirectUrl: preference.init_point };
}
