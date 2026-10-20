import { requireAdmin } from "@/lib/admin";
import { fiscalEnvironment, missingFiscalSettings } from "@/lib/fiscal";
import { DocumentList, type FiscalDocumentRow } from "./document-list";

export default async function NotasPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("fiscal_documents")
    .select("id, kind, status, environment, number, pdf_url, xml_url, error_message, created_at, recipient")
    .order("created_at", { ascending: false })
    .limit(100);
  const missing = [...new Set([...missingFiscalSettings("nfe"), ...missingFiscalSettings("nfse")])];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Notas fiscais</h1>
        <p className="mt-1 text-sm text-muted">
          Emita a NF-e na página do pedido e a NFS-e dos workshops na aba Workshops.
          {fiscalEnvironment() === "homologacao" && " Ambiente de teste: as notas não têm valor fiscal."}
        </p>
      </div>
      {missing.length > 0 && (
        <p className="rounded-xl bg-wine/10 p-3 text-sm text-wine">Para emitir, falta configurar: {missing.join(", ")}.</p>
      )}
      <section className="rounded-2xl border border-rose-soft p-5">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted">Nenhuma nota emitida ainda.</p>
        ) : (
          <DocumentList documents={(data ?? []) as FiscalDocumentRow[]} />
        )}
      </section>
    </div>
  );
}
