import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

/** VAPID sign helper using Web Crypto (no external dependencies) */
async function vapidSign(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = `${header}.${payload}`;

  const raw = Uint8Array.from(atob(privateKeyB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", raw.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(data)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sigB64}`;
}

/**
 * POST /api/push/send
 * Sends a push notification to all subscriptions of the given user IDs.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userIds, payload } = (await request.json()) as {
      userIds: string[];
      payload: PushPayload;
    };

    if (!userIds?.length || !payload?.title) {
      return NextResponse.json({ error: "Missing userIds or payload" }, { status: 400 });
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";
    const vapidSubject = "mailto:hola@kaviro.app";

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: "VAPID keys not configured", sent: 0 });
    }

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (!subs?.length) return NextResponse.json({ sent: 0 });

    const notification = JSON.stringify({
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
      subs.map(async (sub) => {
        if (!sub.endpoint || !sub.p256dh || !sub.auth) return;
        try {
          const origin = new URL(sub.endpoint).origin;
          const jwt = await vapidSign(origin, vapidSubject, vapidPrivate);
          const res = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `vapid t=${jwt},k=${vapidPublic}`,
              "TTL": "86400",
            },
            body: notification,
          });
          if (res.status === 410 || res.status === 404) dead.push(sub.endpoint);
          else if (res.ok || res.status === 201) sent++;
        } catch {
          // Network error — ignore
        }
      })
    );

    if (dead.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", dead);
    }

    return NextResponse.json({ sent, dead: dead.length });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
