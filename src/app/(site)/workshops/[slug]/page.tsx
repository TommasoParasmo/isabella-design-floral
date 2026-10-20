import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowerArt } from "@/components/flower-art";
import { getUpcomingWorkshops } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function findWorkshop(slug: string) {
  return (await getUpcomingWorkshops()).find((w) => w.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await findWorkshop((await params).slug);
  return { title: w ? `Workshop ${w.title}` : "Workshop", description: w?.description ?? undefined };
}

export default async function WorkshopPage({ params }: Props) {
  const w = await findWorkshop((await params).slug);
  if (!w) notFound();

  return (
    <section className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <Link href="/workshops" className="text-xs tracking-[0.2em] text-muted uppercase hover:text-wine">← Workshops</Link>
        <div className="mt-6 aspect-[16/10] overflow-hidden rounded-3xl">
          {w.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <FlowerArt seed={w.slug} className="h-full w-full" />
          )}
        </div>
        <p className="mt-6 text-xs tracking-wider text-muted uppercase">{formatDateTime(w.starts_at)}</p>
        <h1 className="mt-1 font-serif text-5xl">{w.title}</h1>
        <p className="mt-4 leading-relaxed text-muted">{w.description}</p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted">Duração</dt><dd>{Math.round(w.duration_minutes / 60)} horas</dd></div>
          <div><dt className="text-xs text-muted">Local</dt><dd>{w.location}</dd></div>
          <div><dt className="text-xs text-muted">Turma</dt><dd>{w.capacity} pessoas</dd></div>
        </dl>
        <h2 className="mt-8 font-serif text-2xl">O que está incluso</h2>
        <ul className="mt-2 space-y-1 text-sm">{w.includes.map((i) => <li key={i}>✿ {i}</li>)}</ul>
        <h2 className="mt-8 font-serif text-2xl">Cancelamento</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reembolso integral até 7 dias antes da data. Depois disso, a vaga pode ser transferida para outra pessoa ou para a próxima turma.
        </p>
      </div>
      <div className="lg:pt-14">
        <p className="mb-4 font-serif text-4xl text-wine">{formatPrice(w.price_cents)}<span className="ml-2 font-sans text-sm text-muted">por pessoa</span></p>
        {w.seats_left > 0 ? (
          <RegisterForm slug={w.slug} priceCents={w.price_cents} seatsLeft={w.seats_left} />
        ) : (
          <p className="rounded-3xl border border-rose-soft p-6 text-center text-muted">Turma esgotada. Fique de olho nas próximas datas!</p>
        )}
        {w.seats_left > 0 && <p className="mt-3 text-center text-xs text-muted">{w.seats_left} de {w.capacity} vagas disponíveis</p>}
      </div>
    </section>
  );
}
