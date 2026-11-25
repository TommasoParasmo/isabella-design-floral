"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { buildReceipt, RECEIPT_ORDER_FIELDS, type ReceiptOrder } from "@/lib/receipt";

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
  // "flower:<id>" ou "product:<id>"
  target: z.string().regex(/^(flower|product):[0-9a-f-]{36}$/, "Escolha o item"),
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
  const [kind, id] = data.target.split(":");
  const { error } = await supabase.from("stock_movements").insert({
    product_id: kind === "product" ? id : null,
    flower_id: kind === "flower" ? id : null,
    quantity,
    reason: data.reason,
    note: data.note || null,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/flores");
  revalidatePath("/", "layout");
}

const toCents = (v: string) => Math.round(Number((v || "0").replace(/\./g, "").replace(",", ".")) * 100);

const flowerSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(60),
  extra_price: z.string().transform(toCents),
  low_stock_threshold: z.coerce.number().int().min(0),
  position: z.coerce.number().int().default(0),
  active: z.literal("on").optional(),
});

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function saveFlower(formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = flowerSchema.parse(Object.fromEntries(formData));
  if (!Number.isFinite(data.extra_price) || data.extra_price < 0) throw new Error("Acréscimo inválido");
  const row = {
    name: data.name,
    extra_price_cents: data.extra_price,
    low_stock_threshold: data.low_stock_threshold,
    position: data.position,
    active: data.active === "on",
    updated_at: new Date().toISOString(),
  };
  const { error } = data.id
    ? await supabase.from("flowers").update(row).eq("id", data.id)
    : await supabase.from("flowers").insert({ ...row, slug: `${slugify(data.name)}-${Date.now().toString(36)}` });
  if (error) throw error;
  revalidatePath("/admin/flores");
  revalidatePath("/admin/estoque");
  revalidatePath("/", "layout");
}

// Endereços das fotos, na ordem do formulário. Só aceita fotos do nosso
// armazenamento ou da pasta /fotos do site.
function photoList(formData: FormData) {
  const storage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/produtos/`;
  const urls = formData
    .getAll("images")
    .filter((v): v is string => typeof v === "string")
    .filter((v) => v.startsWith(storage) || /^\/fotos\/[\w.-]+$/.test(v));
  return [...new Set(urls)].slice(0, 12);
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
  price: z.string().default("").transform((v) => (v.trim() ? toCents(v.trim()) : null)),
  on_request: z.literal("on").optional(),
  low_stock_threshold: z.coerce.number().int().min(0),
  flower_count: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : null))
    .pipe(z.number().int().min(1).max(200).nullable()),
  featured: z.literal("on").optional(),
  same_day: z.literal("on").optional(),
  made_to_order: z.literal("on").optional(),
  active: z.literal("on").optional(),
});

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = productSchema.parse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  // Sob encomenda = sem preço (R$ 0,00): a loja mostra "Sob consulta".
  const price = data.on_request === "on" ? 0 : data.price;
  if (price == null) throw new Error("Informe o preço ou marque \"Sob encomenda\"");
  if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido");

  const images = photoList(formData);

  // Nota fiscal: produto de categoria com NCM próprio (ex.: Vasos) usa o dela; o resto é flor.
  let category: { ncm: string | null } | null = null;
  if (data.category_id) {
    const { data: found, error: categoryError } = await supabase.from("categories").select("ncm").eq("id", data.category_id).maybeSingle();
    if (categoryError) throw categoryError;
    category = found;
  }

  const row = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    category_id: data.category_id || null,
    price_cents: price,
    low_stock_threshold: data.low_stock_threshold,
    // Criação livre não é buquê montável: quem escolhe as flores é a Isa.
    flower_count: data.made_to_order === "on" ? null : data.flower_count,
    featured: data.featured === "on",
    same_day: data.same_day === "on",
    made_to_order: data.made_to_order === "on",
    active: data.active === "on",
    updated_at: new Date().toISOString(),
    images,
    image_url: images[0] ?? null,
    ncm: category?.ncm ?? "06031900",
  };

  const { error } = data.id
    ? await supabase.from("products").update(row).eq("id", data.id)
    : await supabase.from("products").insert(row);
  if (error) throw error;

  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

const counterSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        flowers: z.array(z.object({ flowerId: z.string().uuid(), quantity: z.number().int().min(1) })).optional(),
      }),
    )
    .min(1),
  paymentMethod: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito"]),
  customerName: z.string().trim().max(120).optional(),
  customerCpf: z.string().transform((v) => v.replace(/\D/g, "")).optional(),
  discountCents: z.number().int().min(0).default(0),
});

export async function registerCounterSale(input: z.input<typeof counterSaleSchema>) {
  const { supabase } = await requireAdmin();
  const data = counterSaleSchema.parse(input);
  const { data: orderId, error } = await supabase.rpc("register_counter_sale", {
    p_items: data.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      flowers: i.flowers?.map((f) => ({ flower_id: f.flowerId, quantity: f.quantity })),
    })),
    p_payment_method: data.paymentMethod,
    p_customer_name: data.customerName || "Cliente balcão",
    p_customer_cpf: data.customerCpf || null,
    p_discount_cents: data.discountCents,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/flores");
  revalidatePath("/admin");
  return { ok: true as const, orderId: orderId as string };
}

// Comprovante pronto para a mini impressora (usado logo depois da venda no balcão).
export async function getReceiptData(orderId: string) {
  const { supabase } = await requireAdmin();
  const { data: order, error } = await supabase.from("orders").select(RECEIPT_ORDER_FIELDS).eq("id", orderId).maybeSingle();
  if (error || !order) return null;
  return buildReceipt(order as unknown as ReceiptOrder);
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
  const images = photoList(formData);
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
    images,
    image_url: images[0] ?? null,
  });
  if (error) throw error;
  revalidatePath("/admin/workshops");
  revalidatePath("/workshops");
  revalidatePath("/");
}

export async function saveWorkshopPhotos(workshopId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const images = photoList(formData);
  const { data, error } = await supabase
    .from("workshops")
    .update({ images, image_url: images[0] ?? null })
    .eq("id", workshopId)
    .select("slug")
    .maybeSingle();
  if (error) throw error;
  revalidatePath("/admin/workshops");
  revalidatePath("/workshops");
  if (data) revalidatePath(`/workshops/${data.slug}`);
  revalidatePath("/");
}

function revalidateWorkshop(slug?: string | null) {
  revalidatePath("/admin/workshops");
  revalidatePath("/admin/balcao");
  revalidatePath("/admin/vendas");
  revalidatePath("/workshops");
  if (slug) revalidatePath(`/workshops/${slug}`);
  revalidatePath("/");
}

const workshopEditSchema = workshopSchema.omit({ slug: true }).extend({
  active: z.literal("on").optional(),
});

// Edita uma turma já cadastrada (valor, descrição, data, vagas...). O endereço
// da página não muda para não quebrar links já divulgados.
export async function updateWorkshop(workshopId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const data = workshopEditSchema.parse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!Number.isFinite(data.price) || data.price < 0) throw new Error("Preço inválido");

  const { data: regs, error: regsError } = await supabase
    .from("workshop_registrations")
    .select("seats")
    .eq("workshop_id", workshopId)
    .eq("status", "confirmada");
  if (regsError) throw regsError;
  const taken = (regs ?? []).reduce((n, r) => n + r.seats, 0);
  if (data.capacity < taken) throw new Error(`Já há ${taken} vagas confirmadas: o total de vagas não pode ser menor que isso.`);

  const { data: updated, error } = await supabase
    .from("workshops")
    .update({
      title: data.title,
      description: data.description || null,
      starts_at: `${data.date}T${data.time}:00-03:00`,
      duration_minutes: Math.round(data.duration_hours * 60),
      price_cents: data.price,
      capacity: data.capacity,
      includes: (data.includes ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      active: data.active === "on",
    })
    .eq("id", workshopId)
    .select("slug")
    .maybeSingle();
  if (error) throw error;
  revalidateWorkshop(updated?.slug);
}

const workshopCounterSchema = z.object({
  workshopId: z.string().uuid("Escolha a turma"),
  seats: z.coerce.number().int().min(1, "Mínimo 1 vaga").max(50),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(120).optional(),
  cpf: z.string().transform((v) => v.replace(/\D/g, "")).optional(),
  paymentMethod: z.enum(["pix", "cartao_credito", "cartao_debito", "dinheiro"]),
  total: z.string().default(""),
});

export type WorkshopCounterState = { ok: boolean; message: string } | null;

// Vagas vendidas pessoalmente: entram como inscrição confirmada, descontam das
// vagas do site e aparecem em Vendas. A forma de pagamento fica marcada em
// mp_payment_id como "balcao:<forma>" (não passa pelo Mercado Pago).
export async function registerWorkshopCounterSale(_prev: WorkshopCounterState, formData: FormData): Promise<WorkshopCounterState> {
  const { supabase } = await requireAdmin();
  const parsed = workshopCounterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const data = parsed.data;

  const { data: workshop, error: wError } = await supabase
    .from("workshops")
    .select("id, slug, title, price_cents, capacity")
    .eq("id", data.workshopId)
    .maybeSingle();
  if (wError) return { ok: false, message: wError.message };
  if (!workshop) return { ok: false, message: "Turma não encontrada." };

  // Mesma conta do site: confirmadas + reservas online dos últimos 30 minutos.
  const { data: regs, error: rError } = await supabase
    .from("workshop_registrations")
    .select("seats, status, created_at")
    .eq("workshop_id", workshop.id)
    .neq("status", "cancelada");
  if (rError) return { ok: false, message: rError.message };
  const reservedSince = Date.now() - 30 * 60 * 1000;
  const taken = (regs ?? [])
    .filter((r) => r.status === "confirmada" || (r.status === "aguardando_pagamento" && new Date(r.created_at).getTime() > reservedSince))
    .reduce((n, r) => n + r.seats, 0);
  const left = workshop.capacity - taken;
  if (data.seats > left) {
    return { ok: false, message: left > 0 ? `Só restam ${left} vaga(s) nessa turma.` : "Essa turma já está lotada." };
  }

  const total = data.total.trim() ? toCents(data.total.trim()) : workshop.price_cents * data.seats;
  if (!Number.isFinite(total) || total < 0) return { ok: false, message: "Valor inválido." };
  if (data.cpf && data.cpf.length !== 11) return { ok: false, message: "CPF deve ter 11 números." };

  const now = new Date().toISOString();
  const { data: inserted, error } = await supabase.from("workshop_registrations").insert({
    workshop_id: workshop.id,
    name: data.name || "Venda no balcão",
    email: data.email || "",
    phone: data.phone || null,
    cpf: data.cpf || null,
    seats: data.seats,
    status: "confirmada",
    total_cents: total,
    paid_at: now,
    mp_payment_id: `balcao:${data.paymentMethod}`,
  }).select("id").single();
  if (error) return { ok: false, message: error.message };

  // Confere de novo depois de gravar: se uma inscrição online ou outra venda
  // pegou as últimas vagas ao mesmo tempo, desfaz esta em vez de lotar demais.
  const { data: after } = await supabase
    .from("workshop_registrations")
    .select("seats, status, created_at")
    .eq("workshop_id", workshop.id)
    .neq("status", "cancelada");
  const takenAfter = (after ?? [])
    .filter((r) => r.status === "confirmada" || (r.status === "aguardando_pagamento" && new Date(r.created_at).getTime() > reservedSince))
    .reduce((n, r) => n + r.seats, 0);
  if (takenAfter > workshop.capacity) {
    await supabase.from("workshop_registrations").update({ status: "cancelada" }).eq("id", inserted.id);
    revalidateWorkshop(workshop.slug);
    return { ok: false, message: "As vagas acabaram de ser reservadas no site. Confira a turma e tente de novo." };
  }

  revalidateWorkshop(workshop.slug);
  return {
    ok: true,
    message: `${data.seats} vaga(s) de ${workshop.title} registrada(s): ${formatPrice(total)}. Restam ${left - data.seats} de ${workshop.capacity} vagas no site.`,
  };
}

// Desfaz uma venda de vagas feita no balcão (por engano), liberando as vagas.
export async function cancelWorkshopCounterSale(registrationId: string) {
  const { supabase } = await requireAdmin();
  const { count, error: docsError } = await supabase
    .from("fiscal_documents")
    .select("id", { count: "exact", head: true })
    .eq("workshop_registration_id", registrationId)
    .in("status", ["processando", "autorizado"]);
  if (docsError) throw docsError;
  if (count) throw new Error("Essa venda já tem nota fiscal: cancele a nota em Notas antes de desfazer.");
  const { data, error } = await supabase
    .from("workshop_registrations")
    .update({ status: "cancelada" })
    .eq("id", registrationId)
    .like("mp_payment_id", "balcao:%")
    .select("workshops(slug)")
    .maybeSingle();
  if (error) throw error;
  revalidateWorkshop((data?.workshops as unknown as { slug: string } | null)?.slug);
}
