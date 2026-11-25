import { requireAdmin } from "@/lib/admin";
import { ProductForm } from "../product-form";

export default async function NovoProdutoPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, slug, name").order("position");
  // "Novo vaso" abre o cadastro já na categoria Vasos.
  const category = categories?.find((c) => c.slug === categoria);
  return (
    <div>
      <h1 className="mb-6 font-serif text-4xl">{category?.slug === "vasos" ? "Novo vaso" : "Novo produto"}</h1>
      <ProductForm categories={categories ?? []} product={category ? { category_id: category.id } : undefined} />
    </div>
  );
}
