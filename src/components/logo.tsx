import Link from "next/link";

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={`inline-flex flex-col items-center leading-none ${className}`} aria-label="Isabella Parasmo, página inicial">
      <span className={`font-script text-3xl sm:text-4xl ${light ? "text-rose" : "text-wine"}`}>Isabella Parasmo</span>
      <span className={`mt-0.5 text-[0.62rem] tracking-[0.35em] uppercase ${light ? "text-rose/80" : "text-muted"}`}>
        Designer Floral
      </span>
    </Link>
  );
}
