import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionTitle } from "@/components/section-title";
import { getClubePlans } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import type { ClubePlan } from "@/lib/types";

export const metadata: Metadata = {
  title: "Clube dos Desatentos",
  description: "Assinatura floral anual para quem esquece as datas importantes: você escolhe o plano, combina as datas do ano com a Isa e nós entregamos flores em cada uma.",
};
export const revalidate = 60;

const steps = [
  "Escolha quantas entregas quer no ano",
  "Combine as datas com a Isa pelo WhatsApp",
  "Entregamos flores frescas da estação em cada data",
  "Precisa mudar uma data? É só avisar",
];

const occasions = ["Aniversários", "Dia das Mães", "Dia dos Namorados", "Aniversário de casamento", "Ou só porque sim"];

function planMessage(plan: ClubePlan) {
  return `Olá, Isa! Quero assinar o Clube dos Desatentos, ${plan.name} (${plan.deliveries} entregas no ano, ${formatPrice(plan.price_cents)}).`;
}

export default async function ClubePage() {
  const plans = await getClubePlans();
  if (plans.length === 0) notFound();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6">
        <SectionTitle
          eyebrow="assinatura anual"
          title="Clube dos Desatentos"
          intro="Para quem vive esquecendo as datas importantes. Você paga uma vez, combina com a Isa as datas do ano e a gente cuida das flores, sem você precisar lembrar de nada."
        />
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {occasions.map((o) => (
            <li key={o} className="rounded-full border border-rose-soft px-4 py-1.5 text-xs text-muted">{o}</li>
          ))}
        </ul>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wine font-serif text-xl text-cream">{i + 1}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-blush">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border bg-cream p-7 text-center ${plan.badge ? "border-wine" : "border-rose-soft"}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-wine px-4 py-1 text-[11px] whitespace-nowrap text-cream">
                  {plan.badge}
                </span>
              )}
              <h2 className="font-serif text-3xl">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted">{plan.deliveries} entregas de flores no ano</p>
              <div className="mt-6">
                {plan.list_price_cents != null && plan.list_price_cents > plan.price_cents && (
                  <span className="block text-sm text-muted line-through">{formatPrice(plan.list_price_cents)}</span>
                )}
                <span className="block font-serif text-4xl text-wine">{formatPrice(plan.price_cents)}</span>
                <span className="mt-1 block text-xs text-muted">
                  equivale a {formatPrice(Math.round(plan.price_cents / plan.deliveries))} por entrega
                </span>
              </div>
              {plan.description && <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-muted">{plan.description}</p>}
              <div className="flex-1" />
              <a
                href={whatsappLink(planMessage(plan))}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-full bg-wine px-6 py-3 text-sm text-cream hover:bg-wine-deep"
              >
                Quero esse plano
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-serif text-3xl">Como combinamos as datas</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Depois de escolher o plano, você manda para a Isa as datas do ano, para quem são as flores e o endereço de cada entrega.
          Se alguma data mudar no meio do caminho, é só avisar pelo WhatsApp.
        </p>
        <a
          href={whatsappLink("Olá, Isa! Tenho uma dúvida sobre o Clube dos Desatentos.")}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-full border border-wine px-7 py-3 text-sm text-wine hover:bg-wine hover:text-cream"
        >
          Tirar dúvidas pelo WhatsApp {site.phone}
        </a>
      </section>
    </>
  );
}
