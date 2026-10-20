import { requireAdmin } from "@/lib/admin";
import { ProductForm } from "../product-form";

export default async function NovoProdutoPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name").order("position");
  return (
    <div>
      <h1 className="mb-6 font-serif text-4xl">Novo produto</h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
