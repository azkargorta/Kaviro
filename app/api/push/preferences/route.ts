import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
  mergePushNotificationPreferences,
  normalizePushPreferencesPatch,
  type PushNotificationPreferences,
} from "@/lib/push-notification-preferences";

function toResponse(row: Partial<PushNotificationPreferences> | null) {
  return mergePushNotificationPreferences(row);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("push_notification_preferences")
      .select(
        "enabled, activity_added, activity_edited, expense_added, participant_joined, trip_starts_tomorrow, trip_invite"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ preferences: DEFAULT_PUSH_NOTIFICATION_PREFERENCES, tableMissing: true });
      }
      throw error;
    }

    return NextResponse.json({ preferences: toResponse(data) });
  } catch (err) {
    logger.error("Push preferences GET:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const patch = normalizePushPreferencesPatch(body as Record<string, unknown> | null);
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "No hay cambios" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("push_notification_preferences")
      .select(
        "enabled, activity_added, activity_edited, expense_added, participant_joined, trip_starts_tomorrow, trip_invite"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const merged = {
      ...DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
      ...toResponse(existing),
      ...patch,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("push_notification_preferences")
      .upsert(merged, { onConflict: "user_id" })
      .select(
        "enabled, activity_added, activity_edited, expense_added, participant_joined, trip_starts_tomorrow, trip_invite"
      )
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Falta la tabla push_notification_preferences. Ejecuta docs/kaviro_push_notification_preferences.sql" },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ preferences: toResponse(data) });
  } catch (err) {
    logger.error("Push preferences PATCH:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
