"use client";

import { useActionState, useState, useTransition } from "react";
import { cancelFiscalDocument, refreshFiscalDocument } from "./actions";

export function RefreshButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => refreshFiscalDocument(id))}
      className="text-xs text-wine underline disabled:opacity-50"
    >
      {pending ? "Consultando…" : "Atualizar"}
    </button>
  );
}

export function CancelForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(cancelFiscalDocument.bind(null, id), null);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted underline hover:text-wine">
        Cancelar nota
      </button>
    );
  }
  return (
    <form action={formAction} className="mt-2 flex w-full flex-wrap gap-2">
      <input name="reason" required minLength={15} placeholder="Motivo do cancelamento" className="min-w-0 flex-1 rounded-xl border border-rose-soft bg-cream px-3 py-2 text-xs" />
      <button disabled={pending} className="rounded-full bg-wine px-4 py-2 text-xs text-cream disabled:opacity-50">Confirmar</button>
      {state?.error && <p className="w-full text-xs text-wine">{state.error}</p>}
    </form>
  );
}
