import { NextResponse, type NextRequest } from "next/server";
import { getPayment, isValidSignature } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

const methodLabel: Record<string, string> = {
  bank_transfer: "pix",
  credit_card: "cartao_credito",
  debit_card: "cartao_debito",
  account_money: "saldo_mercado_pago",
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const type = url.searchParams.get("type") ?? body.type;
  const dataId = url.searchParams.get("data.id") ?? body?.data?.id?.toString();

  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });
  if (!isValidSignature(request.headers, dataId)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  // Nunca confia no corpo da notificação: consulta o pagamento direto na API.
  const payment = await getPayment(dataId);
  if (!payment.external_reference) return NextResponse.json({ ignored: true });

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, total_cents, status")
    .eq("id", payment.external_reference)
    .maybeSingle();
  if (!order) return NextResponse.json({ ignored: true });

  if (payment.status === "approved") {
    const paidCents = Math.round(payment.transaction_amount * 100);
    if (paidCents < order.total_cents) {
      console.error(`Pedido ${order.id}: pago ${paidCents}, esperado ${order.total_cents}`);
      return NextResponse.json({ error: "valor divergente" }, { status: 409 });
    }
    const { error } = await supabase.rpc("confirm_order_payment", {
      p_order_id: order.id,
      p_payment_id: String(payment.id),
      p_payment_method: methodLabel[payment.payment_type_id] ?? payment.payment_type_id,
    });
    if (error) throw error;
  } else if (["rejected", "cancelled"].includes(payment.status) && order.status === "aguardando_pagamento") {
    await supabase.from("orders").update({ mp_payment_id: String(payment.id) }).eq("id", order.id);
  } else if (["refunded", "charged_back"].includes(payment.status)) {
    const { error } = await supabase.rpc("cancel_order", { p_order_id: order.id });
    if (error) throw error;
  }

  return NextResponse.json({ ok: true });
}
