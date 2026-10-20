import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Inscrição recebida", robots: { index: false } };

export default function ObrigadoWorkshopPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-script text-4xl text-wine/80">até breve!</p>
      <h1 className="mt-2 font-serif text-5xl">Inscrição recebida</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Assim que o pagamento for confirmado, sua vaga está garantida. A Isa manda os detalhes do encontro pelo WhatsApp alguns dias antes.
      </p>
      <Link href="/workshops" className="mt-8 inline-block rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep">Ver outros workshops</Link>
    </section>
  );
}
