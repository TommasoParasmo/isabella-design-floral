import type { Metadata } from "next";
import { getDeliverySlots } from "@/lib/catalog";
import { storeConfig } from "@/lib/config";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Finalizar pedido" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const slots = await getDeliverySlots();
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-serif text-5xl">Finalizar pedido</h1>
      <CheckoutForm
        slots={slots}
        cutoffHour={storeConfig.sameDayCutoffHour}
        pickupAddress={storeConfig.pickupAddress}
        maxInstallments={storeConfig.maxInstallments}
      />
    </section>
  );
}
