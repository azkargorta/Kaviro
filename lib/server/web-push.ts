import webpush from "web-push";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  /** Agrupa/reemplaza notificaciones en el SO (mismo tag = una sola burbuja). */
  tag?: string;
};

export type PushSubscriptionRow = {
  user_id: string;
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
  updated_at?: string | null;
};

/** Una suscripción por usuario (la más reciente) para no disparar N pushes por evento. */
export function latestPushSubscriptionPerUser(
  rows: PushSubscriptionRow[]
): PushSubscriptionRow[] {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.updated_at ? Date.parse(a.updated_at) : 0;
    const tb = b.updated_at ? Date.parse(b.updated_at) : 0;
    return tb - ta;
  });
  const seen = new Set<string>();
  const out: PushSubscriptionRow[] = [];
  for (const row of sorted) {
    if (!row.user_id || seen.has(row.user_id)) continue;
    if (!row.endpoint || !row.p256dh || !row.auth) continue;
    seen.add(row.user_id);
    out.push(row);
  }
  return out;
}

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
    .select("user_id, endpoint, p256dh, auth, updated_at")
    .in("user_id", unique)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("push_subscriptions read:", error.message);
    return { sent: 0, dead: 0, skipped: "db" };
  }
  const targets = latestPushSubscriptionPerUser((subs ?? []) as PushSubscriptionRow[]);
  if (!targets.length) return { sent: 0, dead: 0 };

  const url = payload.url || "/dashboard";
  const tag = payload.tag?.trim() || url;
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/brand/icon.png",
    badge: "/brand/icon.png",
    url,
    tag,
    data: { url, tag },
  });

  let sent = 0;
  const dead: string[] = [];

  await Promise.allSettled(
    targets.map(async (row) => {
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
