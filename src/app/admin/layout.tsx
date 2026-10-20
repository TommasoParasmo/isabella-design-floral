import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/balcao", label: "Balcão" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/produtos", label: "Produtos" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name } = await requireAdmin();
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-wine text-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-script text-3xl text-rose">Painel do ateliê</Link>
          <div className="flex items-center gap-4 text-xs text-rose/80">
            <span>Olá, {name}</span>
            <Link href="/" className="hover:text-cream">Ver site</Link>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Painel">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-t-xl px-4 py-2 text-sm whitespace-nowrap text-rose hover:bg-wine-deep hover:text-cream">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
