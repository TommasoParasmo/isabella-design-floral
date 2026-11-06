"use client";

import type { ReceiptData } from "@/lib/receipt";
import { MiniPrinterButton } from "../../../mini-printer";

export function ReceiptActions({ whatsappUrl, receipt }: { whatsappUrl: string; receipt: ReceiptData }) {
  return (
    <div className="flex flex-wrap items-start gap-2 print:hidden">
      <MiniPrinterButton receipt={receipt} />
      <button type="button" onClick={() => window.print()} className="rounded-full border border-wine px-5 py-2 text-sm text-wine hover:bg-blush">
        Imprimir
      </button>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-wine px-5 py-2 text-sm text-wine hover:bg-blush">
        Enviar por WhatsApp
      </a>
    </div>
  );
}
