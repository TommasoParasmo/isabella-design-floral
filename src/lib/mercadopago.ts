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

export async function createPreference(input: {
  orderId: string;
  orderCode: string;
  items: PreferenceItem[];
  payer: { name: string; email: string };
}) {
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
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
      external_reference: input.orderId,
      back_urls: {
        success: `${siteUrl()}/pedido/${input.orderCode}`,
        pending: `${siteUrl()}/pedido/${input.orderCode}`,
        failure: `${siteUrl()}/pedido/${input.orderCode}`,
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
