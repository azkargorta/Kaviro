/**
 * Client-side helper to trigger a push notification to trip participants.
 * Call this after a successful mutation (add activity, add expense, etc.)
 */
import type { PushNotifyEvent } from "@/lib/push-notification-preferences";

export type { PushNotifyEvent as NotifyEvent } from "@/lib/push-notification-preferences";

export async function notifyTripParticipants(opts: {
  tripId: string;
  event: PushNotifyEvent;
  actorName: string;
  detail?: string;
  url?: string;
}): Promise<void> {
  try {
    await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  } catch {
    // Non-blocking — notifications are best-effort
  }
}
