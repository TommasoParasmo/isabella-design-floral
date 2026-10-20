"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const ORDER_STATUSES = ["pago", "em_preparo", "saiu_para_entrega", "entregue", "retirado"] as const;

export async function updateOrderStatus(orderId: string, status: (typeof ORDER_STATUSES)[number]) {
  if (!ORDER_STATUSES.includes(status)) throw new Error("Status inválido");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

const movementSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Quantidade não pode ser zero"),
  reason: z.enum(["compra", "perda", "ajuste"]),
  note: z.string().trim().max(200).optional(),
});

export async function addStockMovement(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const data = movementSchema.parse(Object.fromEntries(formData));
  // Perda sempre tira do estoque; compra sempre soma.
  const quantity =
    data.reason === "perda" ? -Math.abs(data.quantity) : data.reason === "compra" ? Math.abs(data.quantity) : data.quantity;
  const { error } = await supabase.from("stock_movements").insert({
    product_id: data.productId,
    quantity,
    reason: data.reason,
    note: data.note || null,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/admin/estoque");
}

const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use só letras minúsculas, números e hífen"),
  description: z.string().trim().max(1000).optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  price: z.string().transform((v) => Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100)),
  low_stock_threshold: z.coerce.number().int().min(0),
  featured: z.literal("on").optional(),
  same_day: z.literal("on").optional(),
  active: z.literal("on").optional(),
});

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = productSchema.parse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!Number.isFinite(data.price) || data.price < 0) throw new Error("Preço inválido");

  let image_url: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) throw new Error("Envie uma imagem");
    const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${data.slug}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("produtos").upload(path, image, { contentType: image.type });
    if (uploadError) throw uploadError;
    image_url = supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl;
  }

  const row = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    category_id: data.category_id || null,
    price_cents: data.price,
    low_stock_threshold: data.low_stock_threshold,
    featured: data.featured === "on",
    same_day: data.same_day === "on",
    active: data.active === "on",
    updated_at: new Date().toISOString(),
    ...(image_url ? { image_url } : {}),
  };

  const { error } = data.id
    ? await supabase.from("products").update(row).eq("id", data.id)
    : await supabase.from("products").insert(row);
  if (error) throw error;

  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

const counterSaleSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1) })).min(1),
  paymentMethod: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito"]),
  customerName: z.string().trim().max(120).optional(),
  customerCpf: z.string().transform((v) => v.replace(/\D/g, "")).optional(),
  discountCents: z.number().int().min(0).default(0),
});

export async function registerCounterSale(input: z.input<typeof counterSaleSchema>) {
  const { supabase } = await requireAdmin();
  const data = counterSaleSchema.parse(input);
  const { data: orderId, error } = await supabase.rpc("register_counter_sale", {
    p_items: data.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_payment_method: data.paymentMethod,
    p_customer_name: data.customerName || "Cliente balcão",
    p_customer_cpf: data.customerCpf || null,
    p_discount_cents: data.discountCents,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  return { ok: true as const, orderId: orderId as string };
}

const workshopSchema = z.object({
  title: z.string().trim().min(2),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  price: z.string().transform((v) => Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100)),
  capacity: z.coerce.number().int().min(1),
  duration_hours: z.coerce.number().min(0.5).default(3),
  includes: z.string().optional(),
});

export async function createWorkshop(formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = workshopSchema.parse(Object.fromEntries(formData));
  if (!Number.isFinite(data.price) || data.price < 0) throw new Error("Preço inválido");
  const { error } = await supabase.from("workshops").insert({
    title: data.title,
    slug: data.slug,
    description: data.description || null,
    // Horário de São Paulo (sem horário de verão desde 2019)
    starts_at: `${data.date}T${data.time}:00-03:00`,
    duration_minutes: Math.round(data.duration_hours * 60),
    price_cents: data.price,
    capacity: data.capacity,
    includes: (data.includes ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  });
  if (error) throw error;
  revalidatePath("/admin/workshops");
  revalidatePath("/workshops");
  revalidatePath("/");
}
