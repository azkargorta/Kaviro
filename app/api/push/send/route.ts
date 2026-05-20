import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:hola@kaviro.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

/**
 * POST /api/push/send
 * Sends a push notification to all subscriptions of the given user IDs.
 * Body: { userIds: string[], payload: PushPayload }
 * This route is internal — only callable server-side (no public exposure needed).
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

    // Get subscriptions for these users
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id")
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
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            notification
          );
          sent++;
        } catch (err: unknown) {
          // 410 Gone = subscription expired, clean it up
          if ((err as { statusCode?: number })?.statusCode === 410) {
            dead.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (dead.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", dead);
    }

    return NextResponse.json({ sent, dead: dead.length });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
