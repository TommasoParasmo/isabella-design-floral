"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";

const nav = [
  { href: "/loja", label: "Loja" },
  { href: "/assinaturas", label: "Assinaturas" },
  { href: "/workshops", label: "Workshops" },
  { href: "/#sobre", label: "Sobre" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-rose-soft bg-cream/90 backdrop-blur">
      <div className="stripes-thin h-1.5" aria-hidden />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition-colors hover:text-wine ${
                pathname.startsWith(item.href) && item.href !== "/#sobre" ? "text-wine" : "text-ink/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/loja"
            className="rounded-full bg-wine px-5 py-2 text-sm text-cream transition-colors hover:bg-wine-deep"
          >
            Encomendar
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-full p-2 text-wine md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-rose-soft px-4 pb-4 md:hidden" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-rose-soft/60 py-3 text-ink/90"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
