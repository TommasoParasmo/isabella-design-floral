import { formatDateTime } from "@/lib/format";
import { CancelForm, RefreshButton } from "./document-actions";

export type FiscalDocumentRow = {
  id: string;
  kind: "nfce" | "nfe" | "nfse";
  status: "processando" | "autorizado" | "rejeitado" | "cancelado" | "erro";
  environment: "homologacao" | "producao";
  number: string | null;
  pdf_url: string | null;
  xml_url: string | null;
  error_message: string | null;
  created_at: string;
  recipient: { name?: string } | null;
};

const statusLabel: Record<FiscalDocumentRow["status"], string> = {
  processando: "Processando",
  autorizado: "Autorizada",
  rejeitado: "Rejeitada",
  cancelado: "Cancelada",
  erro: "Erro no envio",
};

const kindLabel = { nfce: "NFC-e", nfe: "NF-e", nfse: "NFS-e" };

export function DocumentList({ documents }: { documents: FiscalDocumentRow[] }) {
  if (documents.length === 0) return null;
  return (
    <ul className="divide-y divide-rose-soft/60 text-sm">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div>
            <p>
              {kindLabel[doc.kind]} {doc.number ? `nº ${doc.number}` : ""} · {doc.recipient?.name ?? "—"}
            </p>
            <p className="text-xs text-muted">
              {formatDateTime(doc.created_at)}
              {doc.environment === "homologacao" && " · teste (sem valor fiscal)"}
            </p>
            {doc.error_message && <p className="mt-1 text-xs text-wine">{doc.error_message}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blush px-3 py-1 text-xs text-wine">{statusLabel[doc.status]}</span>
            {doc.pdf_url && <a href={doc.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-wine underline">PDF</a>}
            {doc.xml_url && <a href={doc.xml_url} target="_blank" rel="noreferrer" className="text-xs text-wine underline">XML</a>}
            {doc.status === "processando" && <RefreshButton id={doc.id} />}
            {doc.status === "autorizado" && <CancelForm id={doc.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
