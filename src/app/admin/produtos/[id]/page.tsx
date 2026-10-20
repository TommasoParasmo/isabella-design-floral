import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { ProductForm } from "../product-form";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("position"),
  ]);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-6 font-serif text-4xl">{product.name}</h1>
      <ProductForm product={product} categories={categories ?? []} />
    </div>
  );
}
