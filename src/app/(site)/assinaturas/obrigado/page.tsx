import type { Metadata } from "next";
import Link from "next/link";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Assinatura recebida", robots: { index: false } };

export default function ObrigadoAssinaturaPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-script text-4xl text-wine/80">obrigada!</p>
      <h1 className="mt-2 font-serif text-5xl">Assinatura recebida</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Assim que o Mercado Pago confirmar o pagamento, a Isa entra em contato pelo WhatsApp para combinar a primeira entrega.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={whatsappLink("Olá, Isa! Acabei de fazer uma assinatura floral.")} target="_blank" rel="noreferrer" className="rounded-full border border-wine px-7 py-3 text-sm text-wine hover:bg-blush">
          Falar com a Isa
        </a>
        <Link href="/" className="rounded-full bg-wine px-7 py-3 text-sm text-cream hover:bg-wine-deep">Voltar ao site</Link>
      </div>
    </section>
  );
}
