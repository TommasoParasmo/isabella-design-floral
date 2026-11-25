import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { saveClubePlan } from "./actions";

const field = "w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm";

type Row = {
  id: string;
  name: string;
  deliveries: number;
  price_cents: number;
  list_price_cents: number | null;
  badge: string | null;
  description: string | null;
  position: number;
  active: boolean;
};

// "84900" → "849,00", para o campo de preço.
function money(cents: number | null) {
  return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

function PlanForm({ plan, nextPosition }: { plan?: Row; nextPosition: number }) {
  return (
    <form action={saveClubePlan} className="grid gap-3 sm:grid-cols-2">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <label className="text-xs text-muted sm:col-span-2">
        Nome do plano
        <input name="name" required defaultValue={plan?.name} placeholder="Plano Querido" className={field} />
      </label>
      <label className="text-xs text-muted">
        Entregas no ano
        <input name="deliveries" type="number" min={1} max={52} required defaultValue={plan?.deliveries ?? 4} className={field} />
      </label>
      <label className="text-xs text-muted">
        Preço (R$)
        <input name="price" required inputMode="decimal" defaultValue={money(plan?.price_cents ?? null)} placeholder="849,00" className={field} />
      </label>
      <label className="text-xs text-muted">
        Preço &quot;de&quot;, riscado (opcional)
        <input name="list_price" inputMode="decimal" defaultValue={money(plan?.list_price_cents ?? null)} placeholder="999,00" className={field} />
      </label>
      <label className="text-xs text-muted">
        Selo (opcional)
        <input name="badge" defaultValue={plan?.badge ?? ""} placeholder="Mais escolhido" className={field} />
      </label>
      <label className="text-xs text-muted sm:col-span-2">
        Descrição (opcional)
        <textarea name="description" rows={2} defaultValue={plan?.description ?? ""} placeholder="O que vem em cada entrega, frete, etc." className={field} />
      </label>
      <label className="text-xs text-muted">
        Ordem na página
        <input name="position" type="number" min={0} max={99} defaultValue={plan?.position ?? nextPosition} className={field} />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} /> Aparece no site
      </label>
      <button className="w-fit rounded-full bg-wine px-5 py-2 text-xs text-cream hover:bg-wine-deep sm:col-span-2">
        {plan ? "Salvar plano" : "Criar plano"}
      </button>
    </form>
  );
}

export function ClubePlans({ plans }: { plans: Row[] }) {
  const nextPosition = plans.reduce((n, p) => Math.max(n, p.position), 0) + 1;
  return (
    <section className="mt-8 rounded-2xl border border-rose-soft bg-blush/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-2xl">Clube dos Desatentos</h2>
        <Link href="/clube-dos-desatentos" target="_blank" className="text-xs text-wine underline">Ver página</Link>
      </div>
      <p className="mt-1 text-xs text-muted">
        Planos anuais vendidos pelo WhatsApp. Mude preços e entregas aqui; o site atualiza em até 1 minuto.
        Sem nenhum plano ativo, a página sai do ar.
      </p>
      <ul className="mt-4 space-y-2">
        {plans.map((p) => (
          <li key={p.id}>
            <details className="rounded-xl border border-rose-soft bg-cream p-3">
              <summary className="flex cursor-pointer flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">
                  {p.name}
                  {!p.active && <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">fora do site</span>}
                </span>
                <span className="text-muted">{p.deliveries} entregas · {formatPrice(p.price_cents)}</span>
              </summary>
              <div className="mt-3">
                <PlanForm plan={p} nextPosition={nextPosition} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-wine">+ Novo plano</summary>
        <div className="mt-3 rounded-xl border border-rose-soft bg-cream p-3">
          <PlanForm nextPosition={nextPosition} />
        </div>
      </details>
    </section>
  );
}
