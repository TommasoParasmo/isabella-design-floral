"use client";

import { useRef, useState } from "react";

// Galeria de fotos: no celular, arrasta para o lado; no computador, setas e miniaturas.
export function PhotoGallery({ photos, alt, frameClass }: { photos: string[]; alt: string; frameClass: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + photos.length) % photos.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const arrow =
    "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/85 text-lg text-ink shadow transition hover:bg-cream sm:flex";

  return (
    <div>
      <div className={`relative overflow-hidden bg-blush ${frameClass}`}>
        <div
          ref={track}
          onScroll={onScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={i === 0 ? alt : `${alt}, foto ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className={`${arrow} left-3`} aria-label="Foto anterior">‹</button>
            <button type="button" onClick={() => go(index + 1)} className={`${arrow} right-3`} aria-label="Próxima foto">›</button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
              {photos.map((src, i) => (
                <span key={src} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-cream" : "bg-cream/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 hidden gap-2 sm:flex sm:flex-wrap">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-16 w-14 overflow-hidden rounded-lg border-2 transition ${i === index ? "border-wine" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
