import { NextResponse, type NextRequest } from "next/server";
import { getPayment, getPreapproval, isValidSignature, type MpPayment } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

const methodLabel: Record<string, string> = {
  bank_transfer: "pix",
  credit_card: "cartao_credito",
  debit_card: "cartao_debito",
  account_money: "saldo_mercado_pago",
};

type Supabase = ReturnType<typeof createAdminClient>;

function paidEnough(payment: MpPayment, expectedCents: number | null) {
  return expectedCents == null || Math.round(payment.transaction_amount * 100) >= expectedCents;
}

async function handleOrderPayment(supabase: Supabase, payment: MpPayment, orderId: string) {
  const { data: order } = await supabase.from("orders").select("id, total_cents, status").eq("id", orderId).maybeSingle();
  if (!order) return;

  if (payment.status === "approved") {
    if (!paidEnough(payment, order.total_cents)) throw new Error(`Pedido ${order.id}: valor divergente`);
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
}

async function handleSubscriptionPayment(supabase: Supabase, payment: MpPayment, subscriptionId: string) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, kind, total_cents, status, gift_months")
    .eq("id", subscriptionId)
    .maybeSingle();
  // Cobranças mensais da assinatura recorrente também chegam como "payment",
  // mas o status dela é controlado pelos eventos de preapproval.
  if (!sub || sub.kind !== "presente") return;

  if (payment.status === "approved" && sub.status === "pendente") {
    if (!paidEnough(payment, sub.total_cents)) throw new Error(`Assinatura ${sub.id}: valor divergente`);
    const ends = new Date();
    ends.setMonth(ends.getMonth() + (sub.gift_months ?? 0));
    await supabase
      .from("subscriptions")
      .update({
        status: "ativa",
        mp_payment_id: String(payment.id),
        started_at: new Date().toISOString(),
        ends_on: ends.toISOString().slice(0, 10),
      })
      .eq("id", sub.id);
  } else if (["refunded", "charged_back"].includes(payment.status)) {
    await supabase.from("subscriptions").update({ status: "cancelada", canceled_at: new Date().toISOString() }).eq("id", sub.id);
  }
}

async function handleWorkshopPayment(supabase: Supabase, payment: MpPayment, registrationId: string) {
  const { data: reg } = await supabase
    .from("workshop_registrations")
    .select("id, total_cents")
    .eq("id", registrationId)
    .maybeSingle();
  if (!reg) return;

  if (payment.status === "approved") {
    if (!paidEnough(payment, reg.total_cents)) throw new Error(`Inscrição ${reg.id}: valor divergente`);
    const { error } = await supabase.rpc("confirm_workshop_payment", {
      p_registration_id: reg.id,
      p_payment_id: String(payment.id),
    });
    if (error) throw error;
  } else if (["refunded", "charged_back"].includes(payment.status)) {
    await supabase.from("workshop_registrations").update({ status: "cancelada" }).eq("id", reg.id);
  }
}

const preapprovalStatus: Record<string, string> = {
  authorized: "ativa",
  paused: "pausada",
  cancelled: "cancelada",
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const type = url.searchParams.get("type") ?? body.type;
  const dataId = url.searchParams.get("data.id") ?? body?.data?.id?.toString();
  if (!dataId) return NextResponse.json({ ignored: true });
  if (!isValidSignature(request.headers, dataId)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Nunca confia no corpo da notificação: sempre consulta a API do Mercado Pago.
  if (type === "payment") {
    const payment = await getPayment(dataId);
    const ref = payment.external_reference;
    if (!ref) return NextResponse.json({ ignored: true });
    if (ref.startsWith("sub:")) await handleSubscriptionPayment(supabase, payment, ref.slice(4));
    else if (ref.startsWith("ws:")) await handleWorkshopPayment(supabase, payment, ref.slice(3));
    else await handleOrderPayment(supabase, payment, ref);
  } else if (type === "subscription_preapproval") {
    const preapproval = await getPreapproval(dataId);
    const ref = preapproval.external_reference;
    const status = preapprovalStatus[preapproval.status];
    if (ref?.startsWith("sub:") && status) {
      await supabase
        .from("subscriptions")
        .update({
          status,
          mp_preapproval_id: preapproval.id,
          ...(status === "ativa" ? { started_at: new Date().toISOString() } : {}),
          ...(status === "cancelada" ? { canceled_at: new Date().toISOString() } : {}),
        })
        .eq("id", ref.slice(4));
    }
  }

  return NextResponse.json({ ok: true });
}
