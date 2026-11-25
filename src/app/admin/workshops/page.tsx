import { requireAdmin } from "@/lib/admin";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cancelWorkshopCounterSale, createWorkshop, saveWorkshopPhotos, updateWorkshop } from "../actions";
import { PhotoManager } from "../photo-manager";
import { issueWorkshopInvoice } from "../notas/actions";
import { DocumentList, type FiscalDocumentRow } from "../notas/document-list";
import { InvoiceForm } from "../notas/invoice-form";

const field = "w-full rounded-xl border border-rose-soft bg-cream px-3 py-2 text-sm";

const paymentLabels: Record<string, string> = { pix: "Pix", cartao_credito: "crédito", cartao_debito: "débito", dinheiro: "dinheiro" };

// Data e hora da turma no fuso de São Paulo, para preencher o formulário.
function localDateTime(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export default async function WorkshopsAdminPage() {
  const { supabase } = await requireAdmin();
  const { data: workshops } = await supabase
    .from("workshops")
    .select("id, title, description, starts_at, duration_minutes, includes, active, image_url, images, capacity, price_cents, workshop_registrations(id, name, email, phone, cpf, seats, status, issue, total_cents, mp_payment_id, fiscal_documents(id, kind, status, environment, number, pdf_url, xml_url, error_message, created_at, recipient))")
    .order("starts_at", { ascending: false });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <h1 className="font-serif text-4xl">Workshops</h1>
        {(workshops ?? []).map((w) => {
          const confirmed = w.workshop_registrations.filter((r) => r.status === "confirmada");
          const issues = w.workshop_registrations.filter((r) => r.issue);
          const seats = confirmed.reduce((n, r) => n + r.seats, 0);
          const { date, time } = localDateTime(w.starts_at);
          return (
            <section key={w.id} className={`rounded-2xl border border-rose-soft p-5 ${w.active ? "" : "opacity-60"}`}>
              <p className="text-xs text-muted">{formatDateTime(w.starts_at)} · {formatPrice(w.price_cents)}{w.active ? "" : " · oculto no site"}</p>
              <h2 className="font-serif text-2xl">{w.title}</h2>
              <p className="text-sm text-muted">{seats} de {w.capacity} vagas confirmadas · {Math.max(w.capacity - seats, 0)} disponíveis</p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-wine">Editar turma (valor, descrição, data, vagas)</summary>
                <form action={updateWorkshop.bind(null, w.id)} className="mt-3 space-y-3">
                  <label className="block text-xs text-muted">
                    Título
                    <input name="title" required defaultValue={w.title} className={`${field} mt-1`} />
                  </label>
                  <label className="block text-xs text-muted">
                    Descrição
                    <textarea name="description" rows={4} defaultValue={w.description ?? ""} className={`${field} mt-1`} />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs text-muted">
                      Data
                      <input name="date" type="date" required defaultValue={date} className={`${field} mt-1`} />
                    </label>
                    <label className="block text-xs text-muted">
                      Horário
                      <input name="time" type="time" required defaultValue={time} className={`${field} mt-1`} />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block text-xs text-muted">
                      Preço por pessoa (R$)
                      <input name="price" required inputMode="decimal" defaultValue={(w.price_cents / 100).toFixed(2).replace(".", ",")} className={`${field} mt-1`} />
                    </label>
                    <label className="block text-xs text-muted">
                      Total de vagas
                      <input name="capacity" type="number" min={Math.max(seats, 1)} required defaultValue={w.capacity} className={`${field} mt-1`} />
                    </label>
                    <label className="block text-xs text-muted">
                      Horas
                      <input name="duration_hours" type="number" min={0.5} step={0.5} defaultValue={w.duration_minutes / 60} className={`${field} mt-1`} />
                    </label>
                  </div>
                  <label className="block text-xs text-muted">
                    Incluso (separe por vírgula)
                    <input name="includes" defaultValue={(w.includes ?? []).join(", ")} className={`${field} mt-1`} />
                  </label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={w.active} /> Visível no site</label>
                  <button className="rounded-full bg-wine px-5 py-2 text-xs text-cream hover:bg-wine-deep">Salvar alterações</button>
                  <p className="text-xs text-muted">Quem já se inscreveu mantém o valor que pagou. Vendeu vagas pessoalmente? Registre em Balcão → Vagas de workshop.</p>
                </form>
              </details>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-wine">Fotos ({w.images?.length || (w.image_url ? 1 : 0)})</summary>
                <form action={saveWorkshopPhotos.bind(null, w.id)} className="mt-3 space-y-3">
                  <PhotoManager folder="workshops" initial={w.images?.length ? w.images : w.image_url ? [w.image_url] : []} />
                  <button className="rounded-full bg-wine px-5 py-2 text-xs text-cream hover:bg-wine-deep">Salvar fotos</button>
                </form>
              </details>
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
                    const counter = r.mp_payment_id?.startsWith("balcao:") ? r.mp_payment_id.slice(7) : null;
                    return (
                      <li key={r.id} className="py-2">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>
                            {r.name}{r.seats > 1 ? ` (${r.seats} vagas)` : ""}
                            {counter && (
                              <span className="ml-2 text-xs text-muted">
                                balcão · {paymentLabels[counter] ?? counter}{r.total_cents != null ? ` · ${formatPrice(r.total_cents)}` : ""}
                              </span>
                            )}
                          </span>
                          <span className="text-muted">{[r.phone, r.email].filter(Boolean).join(" · ")}</span>
                        </div>
                        {counter && !invoiced && (
                          <form action={cancelWorkshopCounterSale.bind(null, r.id)} className="mt-1">
                            <button className="text-xs text-muted underline hover:text-wine">Desfazer esta venda (libera as vagas)</button>
                          </form>
                        )}
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
        <PhotoManager folder="workshops" clearOnReset />
        <button className="w-full rounded-full bg-wine py-2.5 text-sm text-cream hover:bg-wine-deep">Criar turma</button>
      </form>
    </div>
  );
}
