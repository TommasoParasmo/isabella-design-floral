"use client";

import { useActionState, useState } from "react";
import { AddressFields, emptyAddress, inputClass, type Address } from "@/components/address-fields";
import type { FiscalFormState } from "./actions";

type Defaults = { name?: string; document?: string; email?: string; address?: Partial<Address> | null };

// Formulário de emissão: os dados vêm do pedido e a Isa só confere.
export function InvoiceForm({
  action,
  kind,
  defaults,
}: {
  action: (prev: FiscalFormState, formData: FormData) => Promise<FiscalFormState>;
  kind: "nfe" | "nfse";
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [address, setAddress] = useState<Address>({ ...emptyAddress, ...(defaults.address ?? {}) });

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required defaultValue={defaults.name} placeholder="Nome ou razão social" className={inputClass} />
        <input name="document" required defaultValue={defaults.document} inputMode="numeric" placeholder="CPF ou CNPJ" className={inputClass} />
        <input name="email" type="email" defaultValue={defaults.email} placeholder="E-mail para receber a nota" className={inputClass} />
        {kind === "nfe" && <input name="stateRegistration" inputMode="numeric" placeholder="Inscrição estadual (se empresa)" className={inputClass} />}
      </div>
      {kind === "nfe" && (
        <>
          <AddressFields value={address} onChange={setAddress} />
          {Object.entries(address).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </>
      )}
      {state?.error && <p className="rounded-xl bg-wine/10 p-3 text-sm text-wine">{state.error}</p>}
      {state?.ok && <p className="rounded-xl bg-blush p-3 text-sm text-ink">{state.ok}</p>}
      <button disabled={pending} className="rounded-full bg-wine px-5 py-2.5 text-sm text-cream hover:bg-wine-deep disabled:opacity-50">
        {pending ? "Enviando…" : kind === "nfe" ? "Emitir NF-e" : "Emitir NFS-e"}
      </button>
    </form>
  );
}
