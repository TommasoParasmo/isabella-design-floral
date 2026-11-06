import { flowerSummary, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

// Dados do comprovante já formatados, para a página e para a mini impressora.

export const RECEIPT_ORDER_FIELDS =
  "id, code, status, created_at, customer_name, customer_phone, customer_cpf, payment_method, delivery_fee_cents, discount_cents, total_cents, order_items(id, product_name, quantity, unit_price_cents, flowers)";

const paymentLabel: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  dinheiro: "Dinheiro",
};

export type ReceiptOrder = {
  id: string;
  code: string | number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_cpf: string | null;
  payment_method: string | null;
  delivery_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  order_items: { id: string; product_name: string; quantity: number; unit_price_cents: number; flowers: { name: string; quantity: number }[] | null }[];
};

export type ReceiptData = {
  shop: string;
  tagline: string;
  instagram: string;
  cnpj: string | null;
  code: string;
  date: string;
  customer: string;
  cpf: string | null;
  payment: string | null;
  items: { label: string; detail: string | null; amount: string }[];
  extras: { label: string; amount: string }[];
  total: string;
};

export function buildReceipt(order: ReceiptOrder): ReceiptData {
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(order.created_at));
  const cnpj = process.env.FISCAL_CNPJ?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") ?? null;
  return {
    shop: site.name,
    tagline: `${site.tagline} · ${site.city}`,
    instagram: `@${site.instagram}`,
    cnpj,
    code: String(order.code),
    date,
    customer: order.customer_name,
    cpf: order.customer_cpf,
    payment: order.payment_method ? (paymentLabel[order.payment_method] ?? order.payment_method.replace(/_/g, " ")) : null,
    items: order.order_items.map((i) => ({
      label: `${i.quantity}× ${i.product_name}`,
      detail: flowerSummary(i.flowers),
      amount: formatPrice(i.unit_price_cents * i.quantity),
    })),
    extras: [
      ...(order.delivery_fee_cents > 0 ? [{ label: "Entrega", amount: formatPrice(order.delivery_fee_cents) }] : []),
      ...(order.discount_cents > 0 ? [{ label: "Desconto", amount: `−${formatPrice(order.discount_cents)}` }] : []),
    ],
    total: formatPrice(order.total_cents),
  };
}
