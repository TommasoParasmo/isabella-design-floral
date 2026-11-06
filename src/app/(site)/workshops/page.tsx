import type { Metadata } from "next";
import Link from "next/link";
import { FlowerArt } from "@/components/flower-art";
import { SectionTitle } from "@/components/section-title";
import { getUpcomingWorkshops } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

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
      <div className="mx-auto mt-12 grid max-w-4xl items-center gap-6 rounded-3xl bg-blush p-6 sm:grid-cols-[1fr_1fr_1.1fr]">
        {[
          ["/fotos/atelie-sala.jpg", "Sala de workshops do ateliê, com mesa de madeira e cadeiras pretas"],
          ["/fotos/atelie-mesa.jpg", "Mesa de trabalho do ateliê com prateleiras de materiais"],
        ].map(([src, alt]) => (
          <div key={src} className="aspect-[4/5] overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="h-full w-full object-cover" />
          </div>
        ))}
        <div>
          <p className="font-script text-3xl text-wine/80">o ateliê</p>
          <h2 className="mt-1 font-serif text-3xl">Onde acontecem os workshops</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Uma mesa grande, flores frescas e tudo o que você precisa para criar. As turmas são pequenas para a Isa
            acompanhar cada pessoa de perto.
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.address}, ${site.city}`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-wine underline underline-offset-4"
          >
            {site.address}, {site.city}
          </a>
        </div>
      </div>
      <div className="mt-14 space-y-8">
        {workshops.length === 0 && <p className="text-center text-muted">Novas turmas em breve.</p>}
        {workshops.map((w) => (
          <article key={w.id} id={w.slug} className="grid scroll-mt-24 gap-6 rounded-3xl border border-rose-soft bg-cream p-6 md:grid-cols-[220px_1fr]">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl">
              {w.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <FlowerArt seed={w.slug} className="h-full w-full" />
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-xs tracking-wider text-muted uppercase">
                {formatDateTime(w.starts_at)} · {Math.round(w.duration_minutes / 60)}h · {w.location}
              </p>
              <h2 className="mt-2 font-serif text-4xl"><Link href={`/workshops/${w.slug}`} className="hover:text-wine">{w.title}</Link></h2>
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
                  <Link
                    href={`/workshops/${w.slug}`}
                    className="rounded-full bg-wine px-6 py-3 text-sm text-cream hover:bg-wine-deep md:ml-auto"
                  >
                    Garantir minha vaga
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
