import { saveProduct } from "../actions";
import { PhotoManager } from "../photo-manager";

type Category = { id: string; name: string };
export type ProductFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  category_id?: string | null;
  price_cents?: number;
  low_stock_threshold?: number;
  flower_count?: number | null;
  made_to_order?: boolean;
  featured?: boolean;
  same_day?: boolean;
  active?: boolean;
  image_url?: string | null;
  images?: string[] | null;
};

const field = "w-full rounded-xl border border-rose-soft bg-cream px-4 py-2.5 text-sm outline-none focus:border-wine";

export function ProductForm({ product = {}, categories }: { product?: ProductFormValues; categories: Category[] }) {
  return (
    <form action={saveProduct} className="max-w-2xl space-y-4">
      <input type="hidden" name="id" value={product.id ?? ""} />
      <label className="block text-sm">
        Nome
        <input name="name" required defaultValue={product.name} className={`${field} mt-1`} />
      </label>
      <label className="block text-sm">
        Endereço na loja (ex.: buque-bordo)
        <input name="slug" required pattern="[a-z0-9-]+" defaultValue={product.slug} className={`${field} mt-1`} />
      </label>
      <label className="block text-sm">
        Descrição
        <textarea name="description" rows={3} defaultValue={product.description ?? ""} className={`${field} mt-1`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          Preço (R$)
          <input
            name="price"
            required
            inputMode="decimal"
            defaultValue={product.price_cents != null ? (product.price_cents / 100).toFixed(2).replace(".", ",") : ""}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm">
          Categoria
          <select name="category_id" defaultValue={product.category_id ?? ""} className={`${field} mt-1`}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Alerta de estoque baixo
          <input name="low_stock_threshold" type="number" min={0} defaultValue={product.low_stock_threshold ?? 3} className={`${field} mt-1`} />
        </label>
      </div>
      <label className="block text-sm">
        Flores que o cliente escolhe
        <input name="flower_count" type="number" min={1} max={200} placeholder="Deixe vazio para produto pronto" defaultValue={product.flower_count ?? ""} className={`${field} mt-1`} />
        <span className="mt-1 block text-xs text-muted">
          Com um número aqui, o produto vira buquê montável: o cliente escolhe essa quantidade de flores e o estoque baixado é o das flores.
        </span>
      </label>
      <fieldset className="text-sm">
        <legend>Fotos</legend>
        <div className="mt-1">
          <PhotoManager
            folder="produtos"
            initial={product.images?.length ? product.images : product.image_url ? [product.image_url] : []}
          />
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={product.active ?? true} /> Visível na loja</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product.featured} /> Destaque na home</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="same_day" defaultChecked={product.same_day ?? true} /> Entrega no mesmo dia</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="made_to_order" defaultChecked={product.made_to_order ?? false} /> Criação livre (sem controle de estoque)</label>
      </div>
      <button className="rounded-full bg-wine px-8 py-3 text-sm text-cream hover:bg-wine-deep">Salvar produto</button>
      {!product.id && <p className="text-xs text-muted">O estoque inicial é lançado em Estoque → Entrada (no buquê montável, é o estoque das flores).</p>}
    </form>
  );
}
