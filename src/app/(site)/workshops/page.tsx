import type { Metadata } from "next";
import { FlowerArt } from "@/components/flower-art";
import { SectionTitle } from "@/components/section-title";
import { getUpcomingWorkshops } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Workshops" };
export const revalidate = 60;

export default async function WorkshopsPage() {
  const workshops = await getUpcomingWorkshops();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionTitle
        eyebrow="mãos nas flores"
        title="Workshops"
        intro="Turmas pequenas no ateliê, com todo o material incluso. Você aprende, cria e leva sua peça para casa."
      />
      <div className="mt-14 space-y-8">
        {workshops.length === 0 && <p className="text-center text-muted">Novas turmas em breve.</p>}
        {workshops.map((w) => (
          <article key={w.id} id={w.slug} className="grid scroll-mt-24 gap-6 rounded-3xl border border-rose-soft bg-cream p-6 md:grid-cols-[220px_1fr]">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl">
              <FlowerArt seed={w.slug} className="h-full w-full" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs tracking-wider text-muted uppercase">
                {formatDateTime(w.starts_at)} · {Math.round(w.duration_minutes / 60)}h · {w.location}
              </p>
              <h2 className="mt-2 font-serif text-4xl">{w.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{w.description}</p>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {w.includes.map((item) => (
                  <li key={item} className="rounded-full bg-blush px-3 py-1 text-wine">{item}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-auto md:pt-6">
                <p className="font-serif text-3xl text-wine">{formatPrice(w.price_cents)}</p>
                <p className="text-sm text-muted">{w.seats_left > 0 ? `${w.seats_left} de ${w.capacity} vagas` : "Turma esgotada"}</p>
                {w.seats_left > 0 && (
                  <a
                    href={whatsappLink(`Olá, Isa! Quero me inscrever no workshop ${w.title}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-wine px-6 py-3 text-sm text-cream hover:bg-wine-deep md:ml-auto"
                  >
                    Garantir minha vaga
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
