import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { storeConfig } from "./config";

const API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não configurado");
  return t;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

type PreferenceItem = { id: string; title: string; quantity: number; unit_price_cents: number };

// external_reference identifica o que está sendo pago no webhook:
// "<uuid>" = pedido, "sub:<uuid>" = assinatura presente, "ws:<uuid>" = workshop.
export async function createPreference(input: {
  externalReference: string;
  returnPath: string;
  items: PreferenceItem[];
  payer: { name: string; email: string };
}) {
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.externalReference,
    },
    body: JSON.stringify({
      items: input.items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price_cents / 100,
        currency_id: "BRL",
      })),
      payer: { name: input.payer.name, email: input.payer.email },
      external_reference: input.externalReference,
      back_urls: {
        success: `${siteUrl()}${input.returnPath}`,
        pending: `${siteUrl()}${input.returnPath}`,
        failure: `${siteUrl()}${input.returnPath}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl()}/api/mercadopago/webhook`,
      statement_descriptor: "ISABELLAPARASMO",
      payment_methods: {
        installments: storeConfig.maxInstallments,
        excluded_payment_types: [{ id: "ticket" }],
      },
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago recusou a preferência: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string; init_point: string };
  return data;
}

export type MpPayment = {
  id: number;
  status: "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "refunded" | "charged_back" | string;
  external_reference: string | null;
  transaction_amount: number;
  payment_type_id: string;
  payment_method_id: string;
};

export async function getPayment(id: string): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pagamento ${id} não encontrado: ${res.status}`);
  return res.json();
}

// Valida a assinatura x-signature enviada pelo Mercado Pago.
// https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
export function isValidSignature(headers: Headers, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem segredo configurado, a confirmação depende só da consulta à API
  const signature = headers.get("x-signature") ?? "";
  const requestId = headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Assinatura recorrente (cobrança mensal automática no cartão).
// https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval/post
export async function createPreapproval(input: {
  externalReference: string;
  reason: string;
  payerEmail: string;
  amountCents: number;
  returnPath: string;
}) {
  const res = await fetch(`${API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.externalReference,
    },
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      back_url: `${siteUrl()}${input.returnPath}`,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amountCents / 100,
        currency_id: "BRL",
      },
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago recusou a assinatura: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string; init_point: string };
}

export type MpPreapproval = {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled" | string;
  external_reference: string | null;
};

export async function getPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${API}/preapproval/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Assinatura ${id} não encontrada: ${res.status}`);
  return res.json();
}
