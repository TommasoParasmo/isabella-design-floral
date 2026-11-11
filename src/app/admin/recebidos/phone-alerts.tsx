"use client";

import { useEffect, useState, useTransition } from "react";
import { removeDevice, saveDevice, sendTestAlert } from "./actions";

type State = "carregando" | "sem-suporte" | "iphone-instalar" | "bloqueado" | "desligado" | "ligado";

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Navegador";
}

function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function PhoneAlerts({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("carregando");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return setState(isIos() && !isInstalled() ? "iphone-instalar" : "sem-suporte");
      if (Notification.permission === "denied") return setState("bloqueado");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        setEndpoint(sub.endpoint);
        setState("ligado");
        // Mantém o cadastro em dia (ex.: o banco foi limpo ou o aparelho trocou a chave).
        const json = sub.toJSON();
        saveDevice({ endpoint: sub.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth, device: deviceName() }).catch(() => {});
      } else {
        setState("desligado");
      }
    })().catch(() => setState("sem-suporte"));
  }, []);

  function turnOn() {
    setMessage(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "bloqueado" : "desligado");
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
        const json = sub.toJSON();
        await saveDevice({ endpoint: sub.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth, device: deviceName() });
        setEndpoint(sub.endpoint);
        setState("ligado");
        const ok = await sendTestAlert(sub.endpoint);
        setMessage(ok ? "Pronto! Mandamos um aviso de teste para este aparelho." : "Avisos ligados, mas o teste não chegou. Tente de novo.");
      } catch {
        setMessage("Não deu para ligar os avisos neste aparelho. Tente de novo.");
      }
    });
  }

  function turnOff() {
    setMessage(null);
    startTransition(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (endpoint) await removeDevice(endpoint);
      await sub?.unsubscribe();
      setEndpoint(null);
      setState("desligado");
    });
  }

  function test() {
    if (!endpoint) return;
    setMessage(null);
    startTransition(async () => {
      const ok = await sendTestAlert(endpoint);
      setMessage(ok ? "Aviso de teste enviado." : "O teste não chegou. Desligue e ligue os avisos de novo.");
    });
  }

  if (state === "carregando") return null;

  return (
    <section className="rounded-2xl border border-rose-soft bg-white/60 p-5 text-sm" aria-live="polite">
      <h2 className="font-serif text-2xl">Avisos no celular</h2>

      {state === "ligado" && (
        <>
          <p className="mt-1 text-muted">Ligados neste aparelho: cada pedido, inscrição ou assinatura paga no site chega aqui como notificação.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={test} disabled={pending} className="rounded-full bg-wine px-5 py-2 text-xs text-cream hover:bg-wine-deep disabled:opacity-50">
              Enviar aviso de teste
            </button>
            <button type="button" onClick={turnOff} disabled={pending} className="rounded-full border border-rose-soft px-5 py-2 text-xs hover:border-wine disabled:opacity-50">
              Desligar neste aparelho
            </button>
          </div>
        </>
      )}

      {state === "desligado" && (
        <>
          <p className="mt-1 text-muted">Receba uma notificação assim que alguém pagar um pedido no site, mesmo com o painel fechado.</p>
          <button type="button" onClick={turnOn} disabled={pending} className="mt-3 rounded-full bg-wine px-5 py-2 text-xs text-cream hover:bg-wine-deep disabled:opacity-50">
            {pending ? "Ligando…" : "Ligar avisos neste aparelho"}
          </button>
        </>
      )}

      {state === "iphone-instalar" && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
          <li>No Safari, toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima).</li>
          <li>Escolha <strong>Adicionar à Tela de Início</strong> e confirme.</li>
          <li>Abra o painel pelo ícone novo e volte aqui para ligar os avisos.</li>
        </ol>
      )}

      {state === "bloqueado" && (
        <p className="mt-1 text-muted">
          As notificações do painel estão bloqueadas neste aparelho. Libere nos ajustes do celular (Notificações) ou do navegador e
          recarregue esta página.
        </p>
      )}

      {state === "sem-suporte" && (
        <p className="mt-1 text-muted">Este navegador não recebe avisos. No Android use o Chrome; no iPhone, o Safari com o painel na Tela de Início.</p>
      )}

      {message && <p className="mt-3 text-wine">{message}</p>}
    </section>
  );
}
