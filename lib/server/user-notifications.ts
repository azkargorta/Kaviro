import { createSupabaseAdmin } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createSupabaseAdmin>;

export type UserNotificationType =
  | "trip_invite"
  | "invite_accepted"
  | "invite_declined"
  | "activity_added"
  | "activity_edited"
  | "expense_added"
  | "participant_joined"
  | "trip_starts_tomorrow"
  | "trip_announcement"
  | "generic";

export async function createUserNotification(
  admin: Admin,
  input: {
    userId: string;
    type: UserNotificationType;
    title: string;
    body: string;
    url?: string | null;
  }
): Promise<void> {
  const { error } = await admin.from("user_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    url: input.url ?? null,
  });

  if (error) {
    if (error.code === "42P01") return;
    console.error("createUserNotification:", error.message);
  }
}
