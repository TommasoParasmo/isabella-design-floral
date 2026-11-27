import { formatPrice } from "@/lib/format";

// Preço original riscado, mostrado antes do preço com desconto.
export function OldPrice({ item, className = "text-[0.6em]" }: { item: { list_price_cents?: number | null; price_cents: number }; className?: string }) {
  if (!item.list_price_cents || item.list_price_cents <= item.price_cents) return null;
  return (
    <s className={`mr-2 font-sans font-normal text-muted ${className}`} aria-label={`De ${formatPrice(item.list_price_cents)}`}>
      {formatPrice(item.list_price_cents)}
    </s>
  );
}

// Selo "-15% off" para a foto ou ao lado do preço.
export function PromoBadge({ item, className = "" }: { item: { percent_off?: number }; className?: string }) {
  if (!item.percent_off) return null;
  return (
    <span className={`rounded-full bg-wine px-3 py-1 text-[10px] font-medium tracking-wider whitespace-nowrap text-cream uppercase ${className}`}>
      -{item.percent_off}% off
    </span>
  );
}
