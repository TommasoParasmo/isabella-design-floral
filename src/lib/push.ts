import "server-only";
import webpush from "web-push";
import { createAdminClient } from "./supabase/admin";
import { site } from "./site";

export type PushMessage = { title: string; body: string; url: string; tag?: string };

export const pushPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function pushConfigured() {
  return Boolean(pushPublicKey && process.env.VAPID_PRIVATE_KEY);
}

let ready = false;
function setup() {
  if (ready) return;
  const subject = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : `mailto:${site.email}`;
  webpush.setVapidDetails(subject, pushPublicKey, process.env.VAPID_PRIVATE_KEY!);
  ready = true;
}

type Subscription = { id: string; endpoint: string; p256dh: string; auth: string };

async function sendTo(subs: Subscription[], message: PushMessage) {
  setup();
  const supabase = createAdminClient();
  const payload = JSON.stringify(message);
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
        TTL: 60 * 60 * 24,
        urgency: "high",
      }),
    ),
  );
  // Aparelho que desinstalou o painel ou bloqueou as notificações: some da lista.
  const gone = subs.filter((_, i) => {
    const r = results[i];
    return r.status === "rejected" && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0);
  });
  if (gone.length) await supabase.from("push_subscriptions").delete().in("id", gone.map((s) => s.id));
  return results.filter((r) => r.status === "fulfilled").length;
}

// Avisa todos os aparelhos cadastrados. Nunca lança erro: um aviso que
// falha não pode atrapalhar a confirmação do pagamento.
export async function notifyAdmins(message: PushMessage) {
  if (!pushConfigured()) return 0;
  try {
    const { data } = await createAdminClient().from("push_subscriptions").select("id, endpoint, p256dh, auth");
    return data?.length ? await sendTo(data, message) : 0;
  } catch (error) {
    console.error("Falha ao enviar aviso no celular", error);
    return 0;
  }
}

export async function notifyDevice(sub: Subscription, message: PushMessage) {
  if (!pushConfigured()) return 0;
  return sendTo([sub], message);
}
