import type { Metadata } from "next";
import { SectionTitle } from "@/components/section-title";
import { getPlans } from "@/lib/catalog";
import { formatPrice, frequencyLabel } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Assinaturas florais" };
export const revalidate = 60;

export default async function AssinaturasPage() {
  const plans = await getPlans();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionTitle
        eyebrow="flores sem esforço"
        title="Assinaturas florais"
        intro="Receba flores frescas em casa ou no escritório, com curadoria da Isa e cobrança automática. Pause ou cancele quando quiser."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-3xl border p-8 ${i === 1 ? "border-wine bg-wine text-cream" : "border-rose-soft bg-cream"}`}
          >
            <h2 className="font-serif text-3xl">{plan.name}</h2>
            <p className={`mt-2 text-sm ${i === 1 ? "text-rose/90" : "text-muted"}`}>{plan.description}</p>
            <p className={`mt-6 font-serif text-5xl ${i === 1 ? "text-rose" : "text-wine"}`}>{formatPrice(plan.price_cents)}</p>
            <p className={`text-xs ${i === 1 ? "text-rose/70" : "text-muted"}`}>{frequencyLabel[plan.frequency]}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {plan.perks.map((perk) => (
                <li key={perk}>✿ {perk}</li>
              ))}
            </ul>
            <a
              href={whatsappLink(`Olá, Isa! Quero assinar o plano ${plan.name}.`)}
              target="_blank"
              rel="noreferrer"
              className={`mt-8 rounded-full px-6 py-3 text-center text-sm ${
                i === 1 ? "bg-rose text-wine-deep hover:bg-cream" : "bg-wine text-cream hover:bg-wine-deep"
              }`}
            >
              Quero assinar
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
