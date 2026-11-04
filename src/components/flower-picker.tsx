"use client";

import { formatPrice } from "@/lib/format";
import type { Flower } from "@/lib/types";

export type FlowerSelection = Record<string, number>;

export function selectedCount(selection: FlowerSelection) {
  return Object.values(selection).reduce((n, q) => n + q, 0);
}

// Escolha das flores de um buquê: cada flor com seu contador, até fechar o total do tamanho.
export function FlowerPicker({
  flowers,
  total,
  value,
  onChange,
  compact = false,
}: {
  flowers: Flower[];
  total: number;
  value: FlowerSelection;
  onChange: (next: FlowerSelection) => void;
  compact?: boolean;
}) {
  const chosen = selectedCount(value);
  const left = total - chosen;

  function change(flower: Flower, delta: number) {
    const current = value[flower.id] ?? 0;
    const q = Math.max(0, Math.min(current + delta, current + left, Math.max(flower.stock, 0)));
    const next = { ...value, [flower.id]: q };
    if (q === 0) delete next[flower.id];
    onChange(next);
  }

  return (
    <div>
      <p className="flex items-baseline justify-between text-sm" aria-live="polite">
        <span className="font-medium">Escolha {total} flores</span>
        <span className={left === 0 ? "text-green-800" : "text-muted"}>
          {left === 0 ? "Buquê completo" : `faltam ${left}`}
        </span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rose-soft">
        <div className="h-full rounded-full bg-wine transition-all" style={{ width: `${(chosen / total) * 100}%` }} />
      </div>
      <ul className={`mt-4 grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        {flowers.map((flower) => {
          const q = value[flower.id] ?? 0;
          const soldOut = flower.stock <= 0;
          return (
            <li
              key={flower.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 ${
                q > 0 ? "border-wine bg-blush/60" : "border-rose-soft"
              } ${soldOut ? "opacity-50" : ""}`}
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium">{flower.name}</p>
                {(soldOut || flower.extra_price_cents > 0 || compact) && (
                  <p className="text-xs text-muted">
                    {soldOut
                      ? "Esgotada"
                      : [flower.extra_price_cents > 0 && `+ ${formatPrice(flower.extra_price_cents)} cada`, compact && `${flower.stock} em estoque`]
                          .filter(Boolean)
                          .join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center rounded-full border border-rose-soft bg-cream text-sm">
                <button
                  type="button"
                  className="px-3 py-1.5 text-wine disabled:opacity-30"
                  disabled={q === 0}
                  onClick={() => change(flower, -1)}
                  aria-label={`Menos ${flower.name}`}
                >
                  −
                </button>
                <span className="w-6 text-center">{q}</span>
                <button
                  type="button"
                  className="px-3 py-1.5 text-wine disabled:opacity-30"
                  disabled={soldOut || left === 0 || q >= flower.stock}
                  onClick={() => change(flower, 1)}
                  aria-label={`Mais ${flower.name}`}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function selectionToChoices(flowers: Flower[], selection: FlowerSelection) {
  return flowers
    .filter((f) => (selection[f.id] ?? 0) > 0)
    .map((f) => ({ flowerId: f.id, name: f.name, quantity: selection[f.id] }));
}

export function selectionExtraCents(flowers: Flower[], selection: FlowerSelection) {
  return flowers.reduce((n, f) => n + f.extra_price_cents * (selection[f.id] ?? 0), 0);
}
