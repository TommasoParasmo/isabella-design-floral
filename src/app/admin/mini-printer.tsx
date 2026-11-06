"use client";

import { useEffect, useState } from "react";
import { connectPrinter, isPrinterSupported, printerName, printReceipt } from "@/lib/cat-printer";
import type { ReceiptData } from "@/lib/receipt";

export type PrintState = { busy: boolean; error: string | null; done: boolean };

export function printErrorMessage(err: unknown) {
  if (err instanceof DOMException && err.name === "NotFoundError") return "Nenhuma impressora escolhida.";
  if (err instanceof DOMException && err.name === "SecurityError") return "Clique no botão de novo para escolher a impressora.";
  if (err instanceof DOMException && err.name === "NetworkError") return "Não consegui falar com a impressora. Ela está ligada e perto do computador?";
  return err instanceof Error ? err.message : "Não foi possível imprimir.";
}

/** Botão "Imprimir na mini impressora" para um comprovante já carregado. */
export function MiniPrinterButton({ receipt, className }: { receipt: ReceiptData; className?: string }) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<PrintState>({ busy: false, error: null, done: false });
  useEffect(() => setSupported(isPrinterSupported()), []);

  async function print() {
    setState({ busy: true, error: null, done: false });
    try {
      await printReceipt(receipt);
      setState({ busy: false, error: null, done: true });
    } catch (err) {
      setState({ busy: false, error: printErrorMessage(err), done: false });
    }
  }

  if (!supported) return <p className="text-xs text-muted">Para imprimir na mini impressora, abra o painel no Chrome ou no Edge.</p>;
  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        disabled={state.busy}
        onClick={print}
        className={className ?? "rounded-full bg-wine px-5 py-2 text-sm text-cream hover:bg-wine-deep disabled:opacity-60"}
      >
        {state.busy ? "Imprimindo…" : "Imprimir na mini impressora"}
      </button>
      {state.error && <span className="text-xs text-wine" role="alert">{state.error}</span>}
      {state.done && <span className="text-xs text-green-800" role="status">Enviado para {printerName() ?? "a impressora"}.</span>}
    </span>
  );
}

/** Conecta (ou troca) a impressora sem imprimir nada. */
export function PrinterConnect() {
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(isPrinterSupported());
    setName(printerName());
  }, []);
  if (!supported) return null;
  return (
    <span className="text-xs text-muted">
      {name ? `Impressora: ${name} · ` : "Mini impressora não conectada · "}
      <button
        type="button"
        className="underline hover:text-wine"
        onClick={async () => {
          setError(null);
          try {
            await connectPrinter({ pick: Boolean(name) });
            setName(printerName());
          } catch (err) {
            setError(printErrorMessage(err));
          }
        }}
      >
        {name ? "trocar" : "conectar"}
      </button>
      {error && <span className="ml-1 text-wine">{error}</span>}
    </span>
  );
}
