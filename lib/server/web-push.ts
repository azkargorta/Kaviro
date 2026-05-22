import webpush from "web-push";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:hola@kaviro.app",
    publicKey,
    privateKey
  );
  return true;
}

/** Envía notificación push a una lista de usuarios (best-effort). */
export async function sendPushToUserIds(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; dead: number; skipped?: string }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return { sent: 0, dead: 0 };
  if (!configureVapid()) return { sent: 0, dead: 0, skipped: "no_vapid" };

  const admin = createSupabaseAdmin();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", unique);

  if (error) {
    console.error("push_subscriptions read:", error.message);
    return { sent: 0, dead: 0, skipped: "db" };
  }
  if (!subs?.length) return { sent: 0, dead: 0 };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/brand/icon.png",
    badge: "/brand/icon.png",
    url: payload.url || "/dashboard",
    data: { url: payload.url || "/dashboard" },
  });

  let sent = 0;
  const dead: string[] = [];

  await Promise.allSettled(
    subs.map(async (row) => {
      if (!row.endpoint || !row.p256dh || !row.auth) return;
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) dead.push(row.endpoint);
      }
    })
  );

  if (dead.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", dead);
  }

  return { sent, dead: dead.length };
}
