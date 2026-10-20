import Link from "next/link";
import { site, whatsappLink } from "@/lib/site";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-wine text-rose">
      <div className="stripes h-3 opacity-60" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-rose/80">{site.description}</p>
        </div>
        <div className="text-sm">
          <h2 className="font-serif text-xl text-cream">Navegue</h2>
          <ul className="mt-3 space-y-2 text-rose/85">
            <li><Link href="/loja" className="hover:text-cream">Loja</Link></li>
            <li><Link href="/assinaturas" className="hover:text-cream">Assinaturas florais</Link></li>
            <li><Link href="/workshops" className="hover:text-cream">Workshops</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h2 className="font-serif text-xl text-cream">Fale com a Isa</h2>
          <ul className="mt-3 space-y-2 text-rose/85">
            <li><a href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-cream">WhatsApp</a></li>
            <li>
              <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer" className="hover:text-cream">
                @{site.instagram}
              </a>
            </li>
            <li>{site.city}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-rose/15 py-5 text-center text-xs text-rose/60">
        © {new Date().getFullYear()} {site.name} {site.tagline}
      </p>
    </footer>
  );
}
