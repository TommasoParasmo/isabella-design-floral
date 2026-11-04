"use client";

export function ReceiptActions({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className="rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep">
        Imprimir
      </button>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-wine px-5 py-2 text-sm text-wine hover:bg-blush">
        Enviar por WhatsApp
      </a>
    </div>
  );
}
