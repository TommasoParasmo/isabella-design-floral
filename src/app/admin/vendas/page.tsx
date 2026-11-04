import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

type Period = { total: number; count: number; sources: Record<string, { total: number; count: number }> };
type Report = {
  today: string;
  periods: Record<"hoje" | "mes" | "ano", Period>;
  daily: { day: string; total: number }[];
  monthly: { month: string; total: number }[];
  top_products: { name: string; quantity: number; total: number }[];
  payment_methods: Record<string, number>;
  recurring: { active: number; monthly: number };
};

const periodLabel = { hoje: "Hoje", mes: "Este mês", ano: "Este ano" } as const;
const sourceLabel: Record<string, string> = {
  online: "Loja online",
  balcao: "Balcão",
  workshop: "Workshops",
  assinatura: "Assinaturas-presente",
};
const paymentLabel: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Crédito",
  cartao_debito: "Débito",
  dinheiro: "Dinheiro",
  outro: "Mercado Pago",
};

function parseDate(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

function Bars({ data, label, caption }: { data: { key: string; label: string; total: number }[]; label: (d: { label: string }) => string; caption: string }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <figure className="rounded-2xl border border-rose-soft p-5">
      <figcaption className="font-serif text-2xl">{caption}</figcaption>
      <div className="mt-4 flex h-40 items-end gap-0.5 border-b border-rose-soft">
        {data.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end" title={`${label(d)}: ${formatPrice(d.total)}`}>
            <div
              className="w-full rounded-t-[4px] bg-wine group-hover:bg-wine-deep"
              style={{ height: d.total > 0 ? `max(${(d.total / max) * 100}%, 2px)` : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-cream group-hover:block">
              {label(d)} · {formatPrice(d.total)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{data[0] && label(data[0])}</span>
        <span>{data.length > 1 && label(data[data.length - 1])}</span>
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">Ver em tabela</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-t border-rose-soft/60">
                <td className="py-1 capitalize">{label(d)}</td>
                <td className="py-1 text-right">{formatPrice(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export default async function VendasPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("sales_report");
  if (error) throw error;
  const report = data as Report;

  const sources = Object.keys(sourceLabel).filter((s) => report.periods.ano.sources[s]);
  const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const payments = Object.entries(report.payment_methods).sort((a, b) => b[1] - a[1]);
  const paymentsTotal = payments.reduce((n, [, v]) => n + v, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">Vendas</p>
        <h1 className="font-serif text-4xl">Como estão as vendas</h1>
        <p className="mt-1 text-sm text-muted">Pedidos pagos (online e balcão), workshops confirmados e assinaturas-presente.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["hoje", "mes", "ano"] as const).map((key) => {
          const p = report.periods[key];
          return (
            <div key={key} className="rounded-2xl border border-rose-soft bg-blush/40 p-5">
              <p className="text-xs tracking-widest text-muted uppercase">{periodLabel[key]}</p>
              <p className="mt-1 font-serif text-4xl text-wine">{formatPrice(p.total)}</p>
              <p className="mt-1 text-xs text-muted">
                {p.count} {p.count === 1 ? "venda" : "vendas"}
                {p.count > 0 && ` · ticket médio ${formatPrice(Math.round(p.total / p.count))}`}
              </p>
            </div>
          );
        })}
      </div>

      {sources.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-rose-soft p-5">
          <h2 className="font-serif text-2xl">Por canal</h2>
          <table className="mt-3 w-full min-w-[30rem] text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 text-left font-normal">Canal</th>
                {(["hoje", "mes", "ano"] as const).map((k) => (
                  <th key={k} className="py-1 pl-4 text-right font-normal whitespace-nowrap">{periodLabel[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s} className="border-t border-rose-soft/60">
                  <td className="py-2 pr-2">{sourceLabel[s]}</td>
                  {(["hoje", "mes", "ano"] as const).map((k) => {
                    const v = report.periods[k].sources[s];
                    return (
                      <td key={k} className="py-2 pl-4 text-right whitespace-nowrap">
                        {v ? formatPrice(v.total) : "—"}
                        {v && <span className="block text-xs text-muted">{v.count} {v.count === 1 ? "venda" : "vendas"}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Bars
          caption="Dia a dia no mês"
          data={report.daily.map((d) => ({ key: d.day, label: dayFmt.format(parseDate(d.day)), total: d.total }))}
          label={(d) => d.label}
        />
        <Bars
          caption="Mês a mês no ano"
          data={report.monthly.map((m) => ({ key: m.month, label: monthFmt.format(parseDate(m.month)).replace(".", ""), total: m.total }))}
          label={(d) => d.label}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-soft p-5">
          <h2 className="font-serif text-2xl">Mais vendidos no mês</h2>
          {report.top_products.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhuma venda de produto este mês.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {report.top_products.map((p, i) => (
                <li key={p.name} className="flex justify-between gap-3">
                  <span><span className="text-muted">{i + 1}.</span> {p.name} <span className="text-muted">· {p.quantity} un.</span></span>
                  <span className="whitespace-nowrap">{formatPrice(p.total)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="rounded-2xl border border-rose-soft p-5">
          <h2 className="font-serif text-2xl">Formas de pagamento no mês</h2>
          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nenhum pedido pago este mês.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {payments.map(([method, total]) => (
                <li key={method}>
                  <div className="flex justify-between"><span>{paymentLabel[method] ?? method.replace(/_/g, " ")}</span><span>{formatPrice(total)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-blush">
                    <div className="h-2 rounded-full bg-wine" style={{ width: `${paymentsTotal > 0 ? (total / paymentsTotal) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">Só pedidos da loja e do balcão.</p>
        </div>
      </div>

      <p className="rounded-2xl bg-blush/50 p-4 text-sm">
        <strong>Assinaturas recorrentes:</strong> {report.recurring.active}{" "}
        {report.recurring.active === 1 ? "ativa" : "ativas"}, somando {formatPrice(report.recurring.monthly)} por mês. As cobranças mensais
        caem direto no Mercado Pago e não entram nos totais acima.
      </p>
    </div>
  );
}
