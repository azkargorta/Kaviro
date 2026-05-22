/**
 * Client-side helper to trigger a push notification to trip participants.
 * Call this after a successful mutation (add activity, add expense, etc.)
 */
export type NotifyEvent =
  | "activity_added"
  | "activity_edited"
  | "expense_added"
  | "participant_joined"
  | "trip_starts_tomorrow"
  | "trip_invite";

export async function notifyTripParticipants(opts: {
  tripId: string;
  event: NotifyEvent;
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
