import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getCategories } from "@/lib/catalog";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Categorias com aba própria e algo à venda ganham link no menu (ex.: Vasos).
  const tabs = (await getCategories().catch(() => []))
    .filter((c) => c.own_tab)
    .map((c) => ({ href: `/loja?categoria=${c.slug}`, label: c.name }));
  return (
    <>
      <Header tabs={tabs} />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
