import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscription = await request.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh ?? null,
        auth: subscription.keys?.auth ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    // Máx. 3 endpoints por usuario (re-sincronizaciones / varios navegadores).
    const { data: userSubs } = await supabase
      .from("push_subscriptions")
      .select("endpoint")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    const staleEndpoints = (userSubs ?? [])
      .slice(3)
      .map((row) => row.endpoint)
      .filter((ep): ep is string => Boolean(ep));

    if (staleEndpoints.length) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .in("endpoint", staleEndpoints);
    }

    // Mantener preferencias alineadas cuando el dispositivo se re-registra tras un deploy.
    const { data: existingPrefs } = await supabase
      .from("push_notification_preferences")
      .select("enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingPrefs || existingPrefs.enabled !== false) {
      await supabase.from("push_notification_preferences").upsert(
        {
          user_id: user.id,
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint } = await request.json();
    await supabase.from("push_subscriptions").delete()
      .eq("endpoint", endpoint).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}