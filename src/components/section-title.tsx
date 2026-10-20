export function SectionTitle({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-script text-3xl text-wine/80">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-4xl text-ink sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}
