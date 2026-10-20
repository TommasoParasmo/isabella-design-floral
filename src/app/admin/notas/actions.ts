"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
  buildNfe,
  buildNfse,
  cancelDocument,
  consultDocument,
  fiscalEnvironment,
  missingFiscalSettings,
  sendDocument,
  type FiscalKind,
  type FiscalResult,
  type Recipient,
} from "@/lib/fiscal";
import { onlyDigits } from "@/lib/validation";

export type FiscalFormState = { error?: string; ok?: string } | null;

const documentSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 11 || v.length === 14, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).");

const recipientSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome ou a razão social."),
  document: documentSchema,
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  stateRegistration: z.string().transform(onlyDigits).optional(),
});

const addressSchema = z.object({
  cep: z.string().transform(onlyDigits).pipe(z.string().length(8, "CEP inválido.")),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "UF inválida."),
});

function readRecipient(formData: FormData, withAddress: boolean): Recipient {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const base = recipientSchema.parse(raw);
  return {
    name: base.name,
    document: base.document,
    email: base.email || undefined,
    stateRegistration: base.stateRegistration || undefined,
    address: withAddress ? addressSchema.parse(raw) : undefined,
  };
}

function firstError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Dados inválidos.";
  return error instanceof Error ? error.message : "Não foi possível emitir a nota.";
}

// Envia e grava o resultado. Se a chamada cair no meio, a nota fica como
// erro para não travar uma nova tentativa.
async function sendAndStore(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  docId: string,
  kind: FiscalKind,
  ref: string,
  payload: unknown,
) {
  let result: FiscalResult;
  try {
    result = await sendDocument(kind, ref, payload);
  } catch (error) {
    result = { status: "erro", error: firstError(error), raw: {} };
  }
  await supabase.from("fiscal_documents").update(toColumns(result)).eq("id", docId);
  return result;
}

function toColumns(result: FiscalResult) {
  return {
    status: result.status,
    number: result.number ?? null,
    series: result.series ?? null,
    access_key: result.accessKey ?? null,
    pdf_url: result.pdfUrl ?? null,
    xml_url: result.xmlUrl ?? null,
    error_message: result.error ?? null,
    provider_response: result.raw,
    updated_at: new Date().toISOString(),
  };
}

// Já existe uma nota válida (ou em processamento) para este pedido?
async function hasActiveDocument(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  column: "order_id" | "workshop_registration_id",
  id: string,
) {
  const { data } = await supabase
    .from("fiscal_documents")
    .select("id")
    .eq(column, id)
    .in("status", ["processando", "autorizado"])
    .limit(1);
  return (data ?? []).length > 0;
}

export async function issueOrderInvoice(orderId: string, _prev: FiscalFormState, formData: FormData): Promise<FiscalFormState> {
  const { supabase } = await requireAdmin();
  const missing = missingFiscalSettings("nfe");
  if (missing.length) return { error: `Falta configurar na Vercel: ${missing.join(", ")}.` };

  try {
    const recipient = readRecipient(formData, true);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, code, status, channel, delivery_fee_cents, discount_cents, order_items(product_id, product_name, quantity, unit_price_cents, products(ncm, cfop))")
      .eq("id", orderId)
      .single();
    if (error) throw error;
    if (["aguardando_pagamento", "cancelado"].includes(order.status)) return { error: "Só dá para emitir nota de pedido pago." };
    if (await hasActiveDocument(supabase, "order_id", orderId)) return { error: "Este pedido já tem uma nota emitida ou em processamento." };

    type Item = { product_id: string | null; product_name: string; quantity: number; unit_price_cents: number; products: { ncm: string; cfop: string } | null };
    const payload = buildNfe({
      items: (order.order_items as unknown as Item[]).map((item) => ({
        code: item.product_id?.slice(0, 8) ?? "AVULSO",
        description: item.product_name,
        ncm: item.products?.ncm ?? "06031900",
        cfop: item.products?.cfop ?? "5102",
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
      })),
      freightCents: order.delivery_fee_cents,
      discountCents: order.discount_cents,
      recipient,
      inPerson: order.channel === "balcao",
    });

    const ref = `pedido-${order.code}-${Date.now().toString(36)}`;
    const { data: doc, error: insertError } = await supabase
      .from("fiscal_documents")
      .insert({ kind: "nfe", order_id: orderId, provider_ref: ref, environment: fiscalEnvironment(), recipient })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const result = await sendAndStore(supabase, doc.id, "nfe", ref, payload);
    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/admin/notas");
    if (result.status === "erro" || result.status === "rejeitado") return { error: result.error ?? "A nota foi recusada." };
    return { ok: "Nota enviada. A autorização da SEFAZ leva alguns segundos; atualize em seguida." };
  } catch (error) {
    return { error: firstError(error) };
  }
}

export async function issueWorkshopInvoice(registrationId: string, _prev: FiscalFormState, formData: FormData): Promise<FiscalFormState> {
  const { supabase } = await requireAdmin();
  const missing = missingFiscalSettings("nfse");
  if (missing.length) return { error: `Falta configurar na Vercel: ${missing.join(", ")}.` };

  try {
    const recipient = readRecipient(formData, false);
    const { data: reg, error } = await supabase
      .from("workshop_registrations")
      .select("id, status, seats, total_cents, workshops(title, starts_at, price_cents)")
      .eq("id", registrationId)
      .single();
    if (error) throw error;
    if (reg.status !== "confirmada") return { error: "Só dá para emitir nota de inscrição confirmada." };
    if (await hasActiveDocument(supabase, "workshop_registration_id", registrationId)) {
      return { error: "Esta inscrição já tem uma nota emitida ou em processamento." };
    }

    const workshop = reg.workshops as unknown as { title: string; starts_at: string; price_cents: number };
    const { data: dpsNumber, error: seqError } = await supabase.rpc("next_dps_number");
    if (seqError) throw seqError;

    const date = new Date(workshop.starts_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const payload = buildNfse({
      dpsNumber: Number(dpsNumber),
      description: `Workshop de arte floral "${workshop.title}" em ${date} (${reg.seats} vaga${reg.seats > 1 ? "s" : ""})`,
      amountCents: reg.total_cents ?? workshop.price_cents * reg.seats,
      recipient,
    });

    const ref = `workshop-${registrationId.slice(0, 8)}-${Date.now().toString(36)}`;
    const { data: doc, error: insertError } = await supabase
      .from("fiscal_documents")
      .insert({ kind: "nfse", workshop_registration_id: registrationId, provider_ref: ref, environment: fiscalEnvironment(), recipient })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const result = await sendAndStore(supabase, doc.id, "nfse", ref, payload);
    revalidatePath("/admin/workshops");
    revalidatePath("/admin/notas");
    if (result.status === "erro" || result.status === "rejeitado") return { error: result.error ?? "A nota foi recusada." };
    return { ok: "Nota enviada. Atualize em alguns segundos para ver o número." };
  } catch (error) {
    return { error: firstError(error) };
  }
}

async function loadDocument(id: string) {
  const { supabase } = await requireAdmin();
  const { data: doc, error } = await supabase
    .from("fiscal_documents")
    .select("id, kind, provider_ref, order_id, status")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { supabase, doc: doc as { id: string; kind: FiscalKind; provider_ref: string; order_id: string | null; status: string } };
}

function revalidateDocument(orderId: string | null) {
  revalidatePath("/admin/notas");
  revalidatePath("/admin/workshops");
  if (orderId) revalidatePath(`/admin/pedidos/${orderId}`);
}

export async function refreshFiscalDocument(id: string) {
  const { supabase, doc } = await loadDocument(id);
  const result = await consultDocument(doc.kind, doc.provider_ref);
  // Uma consulta que falhou (rede, 404) não apaga o que já sabemos da nota.
  if (result.status !== "erro") await supabase.from("fiscal_documents").update(toColumns(result)).eq("id", id);
  revalidateDocument(doc.order_id);
}

const cancelSchema = z.string().trim().min(15, "A justificativa precisa ter pelo menos 15 letras.").max(255);

export async function cancelFiscalDocument(id: string, _prev: FiscalFormState, formData: FormData): Promise<FiscalFormState> {
  try {
    const reason = cancelSchema.parse(formData.get("reason"));
    const { supabase, doc } = await loadDocument(id);
    if (doc.status !== "autorizado") return { error: "Só notas autorizadas podem ser canceladas." };
    const result = await cancelDocument(doc.kind, doc.provider_ref, reason);
    if (result.status !== "cancelado") return { error: result.error ?? "A SEFAZ não aceitou o cancelamento." };
    // A resposta do cancelamento não traz os links da nota; mantém os que já existem.
    await supabase
      .from("fiscal_documents")
      .update({ status: "cancelado", provider_response: result.raw, updated_at: new Date().toISOString() })
      .eq("id", id);
    revalidateDocument(doc.order_id);
    return { ok: "Nota cancelada." };
  } catch (error) {
    return { error: firstError(error) };
  }
}
