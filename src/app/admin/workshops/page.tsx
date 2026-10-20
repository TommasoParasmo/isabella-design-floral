import { requireAdmin } from "@/lib/admin";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createWorkshop } from "../actions";
import { issueWorkshopInvoice } from "../notas/actions";
import { DocumentList, type FiscalDocumentRow } from "../notas/document-list";
import { InvoiceForm } from "../notas/invoice-form";

const field = "w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm";

export default async function WorkshopsAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: workshops } = await supabase
    .from("workshops")
    .select("id, title, starts_at, capacity, price_cents, workshop_registrations(id, name, email, phone, cpf, seats, status, issue, fiscal_documents(id, kind, status, environment, number, pdf_url, xml_url, error_message, created_at, recipient))")
    .order("starts_at", { ascending: false });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <h1 className="font-serif text-4xl">Workshops</h1>
        {(workshops ?? []).map((w) => {
          const confirmed = w.workshop_registrations.filter((r) => r.status === "confirmada");
          const issues = w.workshop_registrations.filter((r) => r.issue);
          const seats = confirmed.reduce((n, r) => n + r.seats, 0);
          return (
            <section key={w.id} className="rounded-2xl border border-rose-soft p-5">
              <p className="text-xs text-muted">{formatDateTime(w.starts_at)} · {formatPrice(w.price_cents)}</p>
              <h2 className="font-serif text-2xl">{w.title}</h2>
              <p className="text-sm text-muted">{seats} de {w.capacity} vagas confirmadas</p>
              {issues.map((r) => (
                <p key={r.id} className="mt-3 rounded-xl bg-wine/10 p-2 text-xs text-wine">
                  {r.name} ({r.phone}): {r.issue}
                </p>
              ))}
              {confirmed.length > 0 && (
                <ul className="mt-3 divide-y divide-rose-soft/60 text-sm">
                  {confirmed.map((r) => {
                    const docs = r.fiscal_documents as FiscalDocumentRow[];
                    const invoiced = docs.some((d) => d.status === "processando" || d.status === "autorizado");
                    return (
                      <li key={r.id} className="py-2">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>{r.name}{r.seats > 1 ? ` (+${r.seats - 1})` : ""}</span>
                          <span className="text-muted">{r.phone} · {r.email}</span>
                        </div>
                        <DocumentList documents={docs} />
                        {!invoiced && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-wine">Emitir NFS-e</summary>
                            <div className="mt-3">
                              <InvoiceForm
                                kind="nfse"
                                action={issueWorkshopInvoice.bind(null, r.id)}
                                defaults={{ name: r.name, document: r.cpf ?? "", email: r.email }}
                              />
                            </div>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <form action={createWorkshop} className="h-fit space-y-3 rounded-2xl border border-rose-soft bg-blush/50 p-5 lg:sticky lg:top-6">
        <h2 className="font-serif text-2xl">Nova turma</h2>
        <input name="title" required placeholder="Título" className={field} />
        <input name="slug" required pattern="[a-z0-9-]+" placeholder="endereco-da-pagina" className={field} />
        <textarea name="description" rows={3} placeholder="Descrição" className={field} />
        <div className="grid grid-cols-2 gap-2">
          <input name="date" type="date" required className={field} />
          <input name="time" type="time" required defaultValue="14:00" className={field} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input name="price" required inputMode="decimal" placeholder="Preço R$" className={field} />
          <input name="capacity" type="number" min={1} required placeholder="Vagas" className={field} />
          <input name="duration_hours" type="number" min={1} defaultValue={3} placeholder="Horas" className={field} />
        </div>
        <input name="includes" placeholder="Incluso (separe por vírgula)" className={field} />
        <button className="w-full rounded-full bg-wine py-2.5 text-sm text-cream hover:bg-wine-deep">Criar turma</button>
      </form>
    </div>
  );
}
