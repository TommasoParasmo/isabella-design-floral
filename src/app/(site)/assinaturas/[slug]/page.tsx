import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowerArt } from "@/components/flower-art";
import { getPlans } from "@/lib/catalog";
import { formatPrice, frequencyLabel } from "@/lib/format";
import { SubscribeForm } from "./subscribe-form";

type Props = { params: Promise<{ slug: string }> };

async function findPlan(slug: string) {
  return (await getPlans()).find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plan = await findPlan((await params).slug);
  return { title: plan ? `Assinatura ${plan.name}` : "Assinatura" };
}

export default async function PlanPage({ params }: Props) {
  const plan = await findPlan((await params).slug);
  if (!plan) notFound();

  return (
    <section className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <Link href="/assinaturas" className="text-xs tracking-[0.2em] text-muted uppercase hover:text-wine">← Planos</Link>
        <div className="mt-6 aspect-[4/5] max-w-sm overflow-hidden rounded-t-[999px] rounded-b-3xl">
          {plan.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plan.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <FlowerArt seed={`plano-${plan.slug}`} className="h-full w-full" />
          )}
        </div>
        <h1 className="mt-6 font-serif text-5xl">Assinatura {plan.name}</h1>
        <p className="mt-2 font-serif text-3xl text-wine">{formatPrice(plan.price_cents)}</p>
        <p className="text-sm text-muted">{frequencyLabel[plan.frequency]}</p>
        <p className="mt-4 leading-relaxed text-muted">{plan.description}</p>
        <ul className="mt-4 space-y-1 text-sm">
          {plan.perks.map((perk) => <li key={perk}>✿ {perk}</li>)}
        </ul>
      </div>
      <SubscribeForm planSlug={plan.slug} priceCents={plan.price_cents} />
    </section>
  );
}
