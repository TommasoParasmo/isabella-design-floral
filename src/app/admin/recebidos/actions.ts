"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { notifyDevice } from "@/lib/push";

const deviceSchema = z.object({
  endpoint: z.string().url().startsWith("https://"),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(100),
  device: z.string().max(120).optional(),
});

export async function saveDevice(input: z.input<typeof deviceSchema>) {
  const { supabase, user } = await requireAdmin();
  const data = deviceSchema.parse(input);
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ ...data, profile_id: user.id }, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function removeDevice(endpoint: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

export async function sendTestAlert(endpoint: string) {
  const { supabase } = await requireAdmin();
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (!sub) return false;
  const sent = await notifyDevice(sub, {
    title: "Avisos ligados",
    body: "É assim que cada pedido novo do site vai aparecer aqui.",
    url: "/admin/recebidos",
    tag: "teste",
  });
  return sent > 0;
}
