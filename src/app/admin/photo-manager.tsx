"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const MAX_SIDE = 1800;
const MAX_PHOTOS = 12;

// Foto do celular chega com 4 a 10 MB. Reduz para no máximo 1800 px e JPEG,
// o que deixa o site rápido e cabe folgado no armazenamento.
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    // Formato que o navegador não abre (ex.: HEIC no Chrome): envia o original.
    return file;
  }
}

// Envia as fotos direto do navegador para o Supabase e manda para o
// formulário só os endereços, na ordem escolhida (a primeira é a capa).
export function PhotoManager({
  name = "images",
  folder,
  initial = [],
  clearOnReset = false,
}: {
  name?: string;
  folder: string;
  initial?: string[];
  // Formulário de cadastro novo: depois de salvar, começa sem fotos.
  clearOnReset?: boolean;
}) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = root.current?.closest("form");
    if (!clearOnReset || !form) return;
    const reset = () => setPhotos([]);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [clearOnReset]);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const room = MAX_PHOTOS - photos.length;
    if (list.length > room) setError(`Cabem até ${MAX_PHOTOS} fotos. Só as primeiras ${Math.max(room, 0)} foram enviadas.`);
    const supabase = createClient();
    setUploading((n) => n + Math.min(list.length, room));
    await Promise.all(
      list.slice(0, Math.max(room, 0)).map(async (file) => {
        try {
          const blob = await shrink(file);
          const ext = blob.type === "image/jpeg" ? "jpg" : file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("produtos").upload(path, blob, { contentType: blob.type || file.type });
          if (uploadError) throw uploadError;
          const url = supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl;
          setPhotos((p) => [...p, url]);
        } catch {
          setError("Não consegui enviar uma das fotos. Tente de novo.");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  const move = (from: number, to: number) =>
    setPhotos((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const btn = "rounded-full bg-cream/90 px-2 py-0.5 text-xs text-ink shadow hover:bg-cream disabled:opacity-30";

  return (
    <div ref={root} className="space-y-3">
      {photos.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((url, i) => (
            <li key={url} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-blush">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 rounded-full bg-wine px-2 py-0.5 text-[10px] text-cream">Capa</span>}
              <button
                type="button"
                className={`${btn} absolute top-1 right-1`}
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                aria-label="Remover foto"
              >
                ✕
              </button>
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
                <button type="button" className={btn} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
                {i > 0 && <button type="button" className={btn} onClick={() => move(i, 0)}>Capa</button>}
                <button type="button" className={btn} onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Mover para a direita">→</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-wine px-4 py-2 text-sm text-wine hover:bg-wine hover:text-cream">
        + Adicionar fotos
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {/* Impede salvar enquanto ainda há foto subindo. */}
      <input
        type="checkbox"
        required
        checked={uploading === 0}
        onChange={() => {}}
        onInvalid={(e) => e.currentTarget.setCustomValidity("Aguarde as fotos terminarem de enviar")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <p className="text-xs text-muted">
        {uploading > 0
          ? `Enviando ${uploading} foto${uploading > 1 ? "s" : ""}...`
          : "Pode escolher várias de uma vez. A primeira é a capa; use as setas para mudar a ordem."}
      </p>
      {error && <p className="text-xs text-wine">{error}</p>}
    </div>
  );
}
