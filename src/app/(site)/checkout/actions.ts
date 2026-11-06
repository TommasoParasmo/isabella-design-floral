"use server";

import { z } from "zod";
import { getDeliverySlots } from "@/lib/catalog";
import { nowInSaoPaulo, slotsForDate } from "@/lib/delivery";
import { createPreference } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const checkoutSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1).max(50),
          flowers: z
            .array(z.object({ flowerId: z.string().uuid(), quantity: z.number().int().min(1).max(200) }))
            .max(30)
            .optional(),
        }),
      )
      .min(1, "Seu carrinho está vazio."),
    customer: z.object({
      name: z.string().trim().min(3, "Informe seu nome completo."),
      email: z.string().trim().email("E-mail inválido."),
      phone: z.string().transform(onlyDigits).pipe(z.string().min(10, "Telefone inválido.")),
      cpf: z.string().transform(onlyDigits).pipe(z.string().length(11, "CPF deve ter 11 dígitos.")),
    }),
    fulfillment: z.enum(["entrega", "retirada"]),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data."),
    slotId: z.string().min(1, "Escolha o período."),
    recipientName: z.string().trim().max(120).optional(),
    cardMessage: z.string().trim().max(400).optional(),
    address: z
      .object({
        cep: z.string().transform(onlyDigits).pipe(z.string().length(8, "CEP inválido.")),
        street: z.string().trim().min(2, "Informe a rua."),
        number: z.string().trim().min(1, "Informe o número."),
        complement: z.string().trim().optional(),
        neighborhood: z.string().trim().min(2, "Informe o bairro."),
        city: z.string().trim().min(2),
        state: z.string().refine((v) => v.toUpperCase() === "SP", "Entregamos apenas no estado de São Paulo."),
      })
      .optional(),
  })
  .refine((d) => d.fulfillment === "retirada" || d.address, {
    message: "Informe o endereço de entrega.",
    path: ["address"],
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult = { ok: true; redirectUrl: string } | { ok: false; error: string };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.MP_ACCESS_TOKEN) {
    return { ok: false, error: "A loja online ainda está sendo configurada. Faça seu pedido pelo WhatsApp." };
  }

  const supabase = createAdminClient();

  // Preços e estoque sempre vêm do banco, nunca do navegador.
  const ids = data.items.map((i) => i.productId);
  const flowerIds = data.items.flatMap((i) => i.flowers?.map((f) => f.flowerId) ?? []);
  const [{ data: products, error: productsError }, { data: flowers, error: flowersError }] = await Promise.all([
    supabase.from("products").select("id, name, price_cents, stock, same_day, active, flower_count, made_to_order").in("id", ids),
    flowerIds.length
      ? supabase.from("flowers").select("id, name, stock, active, extra_price_cents, position").in("id", flowerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (productsError) throw productsError;
  if (flowersError) throw flowersError;

  type Line = {
    product: (typeof products)[number];
    quantity: number;
    unitPrice: number;
    flowers: { flower_id: string; name: string; quantity: number }[] | null;
  };
  const lines: Line[] = [];
  const productUse = new Map<string, number>();
  const flowerUse = new Map<string, number>();
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.active) return { ok: false, error: "Um dos produtos não está mais disponível." };

    if (!product.flower_count) {
      productUse.set(product.id, (productUse.get(product.id) ?? 0) + item.quantity);
      if (!product.made_to_order && product.stock < productUse.get(product.id)!) {
        return { ok: false, error: `Temos só ${product.stock} unidade(s) de ${product.name} no momento.` };
      }
      lines.push({ product, quantity: item.quantity, unitPrice: product.price_cents, flowers: null });
      continue;
    }

    // Buquê montável: as flores escolhidas precisam fechar a quantidade do tamanho.
    const chosen = [];
    let extra = 0;
    for (const choice of item.flowers ?? []) {
      const flower = flowers.find((f) => f.id === choice.flowerId);
      if (!flower || !flower.active) return { ok: false, error: "Uma das flores escolhidas não está mais disponível." };
      chosen.push({ flower, quantity: choice.quantity });
      extra += flower.extra_price_cents * choice.quantity;
      flowerUse.set(flower.id, (flowerUse.get(flower.id) ?? 0) + choice.quantity * item.quantity);
    }
    const count = chosen.reduce((n, c) => n + c.quantity, 0);
    if (count !== product.flower_count) {
      return { ok: false, error: `O ${product.name} leva ${product.flower_count} flores. Monte o buquê de novo na página dele.` };
    }
    chosen.sort((a, b) => a.flower.position - b.flower.position || a.flower.name.localeCompare(b.flower.name));
    lines.push({
      product,
      quantity: item.quantity,
      unitPrice: product.price_cents + extra,
      flowers: chosen.map((c) => ({ flower_id: c.flower.id, name: c.flower.name, quantity: c.quantity })),
    });
  }

  for (const [flowerId, used] of flowerUse) {
    const flower = flowers.find((f) => f.id === flowerId)!;
    if (flower.stock < used) {
      return {
        ok: false,
        error:
          flower.stock > 0
            ? `Temos só ${flower.stock} ${flower.name.toLowerCase()}(s) no momento. Troque algumas flores do buquê.`
            : `${flower.name} acabou. Troque por outra flor no buquê.`,
      };
    }
  }

  const allSameDay = lines.every((l) => l.product.same_day);
  const slots = await getDeliverySlots();
  const slot = slotsForDate(data.scheduledDate, slots, allSameDay).find((s) => s.id === data.slotId);
  if (!slot) {
    return { ok: false, error: "Esse período não está mais disponível. Escolha outro dia ou horário." };
  }
  if (data.scheduledDate === nowInSaoPaulo().date && !allSameDay) {
    return { ok: false, error: "Alguns itens do carrinho não podem ser entregues hoje." };
  }

  // Lotação do período: conta pedidos pagos e os aguardando pagamento há menos de 30 min.
  const { data: slotRow } = await supabase.from("delivery_slots").select("max_orders").eq("id", slot.id).single();
  const holdSince = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { count: booked } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("scheduled_date", data.scheduledDate)
    .eq("delivery_slot_id", slot.id)
    .neq("status", "cancelado")
    .or(`status.neq.aguardando_pagamento,created_at.gt.${holdSince}`);
  if (slotRow && (booked ?? 0) >= slotRow.max_orders) {
    return { ok: false, error: "Esse período já está lotado. Escolha outro horário ou outro dia." };
  }

  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
  const deliveryFee = data.fulfillment === "entrega" ? slot.fee_cents : 0;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      channel: "online",
      fulfillment: data.fulfillment,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      customer_cpf: data.customer.cpf,
      scheduled_date: data.scheduledDate,
      delivery_slot_id: slot.id,
      recipient_name: data.recipientName || null,
      card_message: data.cardMessage || null,
      delivery_address: data.fulfillment === "entrega" ? data.address : null,
      subtotal_cents: subtotal,
      delivery_fee_cents: deliveryFee,
      total_cents: subtotal + deliveryFee,
    })
    .select("id, code")
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      product_name: l.product.name,
      unit_price_cents: l.unitPrice,
      quantity: l.quantity,
      flowers: l.flowers,
    })),
  );
  if (itemsError) throw itemsError;

  const preferenceItems = lines.map((l) => ({
    id: l.product.id,
    title: l.product.name,
    quantity: l.quantity,
    unit_price_cents: l.unitPrice,
  }));
  if (deliveryFee > 0) {
    preferenceItems.push({ id: "entrega", title: `Entrega · ${slot.label}`, quantity: 1, unit_price_cents: deliveryFee });
  }

  const preference = await createPreference({
    externalReference: order.id,
    returnPath: `/pedido/${order.code}`,
    items: preferenceItems,
    payer: { name: data.customer.name, email: data.customer.email },
  });

  await supabase.from("orders").update({ mp_preference_id: preference.id }).eq("id", order.id);

  return { ok: true, redirectUrl: preference.init_point };
}
