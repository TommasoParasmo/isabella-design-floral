"use client";

export type Address = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const emptyAddress: Address = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "São Paulo",
  state: "SP",
};

export const inputClass =
  "w-full rounded-xl border border-rose-soft bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-wine";

export function AddressFields({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const data = await (await fetch(`https://viacep.com.br/ws/${digits}/json/`)).json();
      if (data.erro) return;
      onChange({
        ...value,
        cep,
        street: data.logradouro || value.street,
        neighborhood: data.bairro || value.neighborhood,
        city: data.localidade || value.city,
        state: data.uf || value.state,
      });
    } catch {
      // preenchimento manual
    }
  }

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <input className={inputClass} placeholder="CEP" inputMode="numeric" required value={value.cep} onChange={set("cep")} onBlur={(e) => lookupCep(e.target.value)} />
        <input className={inputClass} placeholder="Rua" required value={value.street} onChange={set("street")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={inputClass} placeholder="Número" required value={value.number} onChange={set("number")} />
        <input className={`${inputClass} sm:col-span-2`} placeholder="Complemento" value={value.complement} onChange={set("complement")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_80px]">
        <input className={inputClass} placeholder="Bairro" required value={value.neighborhood} onChange={set("neighborhood")} />
        <input className={inputClass} placeholder="Cidade" required value={value.city} onChange={set("city")} />
        <input className={inputClass} placeholder="UF" required maxLength={2} value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value.toUpperCase() })} />
      </div>
    </div>
  );
}
