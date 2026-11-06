import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { getPlans } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { findPlan, howItWorks, planFrequencies, planKinds, planSizes } from "@/lib/plans";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Assinaturas florais",
  description: "Buquês ou arranjos em vasos com flores frescas da estação, entregues em São Paulo toda semana, a cada 15 dias ou uma vez por mês.",
};
export const revalidate = 60;

const gallery = [
  ["/fotos/buque-colorido.jpg", "Buquê colorido com rosas, delfínio e lírios"],
  ["/fotos/arranjo-gerberas.jpg", "Arranjo de gérberas e rosas em caixa rosa"],
  ["/fotos/buque-azul-campo.jpg", "Buquê de delfínio azul e flores brancas"],
  ["/fotos/arranjo-caixa-azul.jpg", "Arranjo de lírios e hortênsias em caixa azul"],
  ["/fotos/arranjo-vaso-ceramica.jpg", "Arranjo de rosas em vaso de cerâmica branca"],
  ["/fotos/arranjo-caixa-rosas.jpg", "Arranjo de rosas pink e cravos em caixa rosa"],
] as const;

export default async function AssinaturasPage() {
  const plans = await getPlans();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <SectionTitle
          eyebrow="por Isabella Parasmo"
          title="Assinatura floral"
          intro="Flores frescas da estação em casa ou no escritório. Escolha entre buquês ou arranjos em vasos, no tamanho e na frequência que combinam com você. Assine para você, sem fidelidade, ou dê de presente por 3, 6 ou 12 meses."
        />

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4">
          {howItWorks.map((step, i) => (
            <li key={step} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wine font-serif text-xl text-cream">{i + 1}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {planKinds.map(({ kind, title, vase, image, imageAlt }, k) => (
        <section key={kind} id={kind} className={`scroll-mt-24 ${k === 1 ? "bg-blush" : ""}`}>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[260px_1fr]">
            <div>
              <p className="font-script text-3xl text-wine/80">assinatura floral</p>
              <h2 className="font-serif text-4xl sm:text-5xl">{title}</h2>
              <p className="mt-3 text-sm text-muted">{vase}</p>
              <div className="mt-6 hidden aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {planFrequencies.map(({ frequency, title: freqTitle, deliveries }) => (
                <div key={frequency} className="flex flex-col rounded-3xl border border-rose-soft bg-cream p-6">
                  <h3 className="font-serif text-2xl">{freqTitle}</h3>
                  <p className="text-xs text-muted">{deliveries}</p>
                  <ul className="mt-5 flex-1 divide-y divide-rose-soft">
                    {planSizes.map(({ size, title: sizeTitle, stems, vase: vaseSize }) => {
                      const plan = findPlan(plans, kind, frequency, size);
                      if (!plan) return null;
                      return (
                        <li key={size}>
                          <Link href={`/assinaturas/${plan.slug}`} className="group flex items-center justify-between gap-3 py-3">
                            <span>
                              <span className="block font-medium group-hover:text-wine">{sizeTitle}</span>
                              <span className="block text-xs text-muted">{stems} · {vaseSize}</span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block font-serif text-2xl text-wine">{formatPrice(plan.price_cents)}</span>
                              <span className="block text-[11px] text-muted">por mês</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {gallery.map(([src, alt]) => (
            <div key={src} className="aspect-[4/5] overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl rounded-3xl border border-rose-soft bg-cream p-8 text-center">
          <h2 className="font-serif text-3xl">Observações importantes</h2>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            <li>Assinaturas de buquês não incluem vaso.</li>
            <li>Assinaturas de arranjos incluem vaso.</li>
            <li>Entregas em São Paulo (frete a calcular) ou retirada.</li>
          </ul>
          <a
            href={whatsappLink("Olá, Isa! Vim pelo site e gostaria de assinar flores.")}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep"
          >
            Assine pelo WhatsApp {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}
