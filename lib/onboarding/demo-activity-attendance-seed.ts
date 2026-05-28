import type { ActivityReactionRow } from "@/lib/activity-reactions";
import type { ActivityInviteScope } from "@/lib/activity-invite-scope";
import { DEMO_TRIP_NAME } from "@/lib/onboarding/demo-trip-seed-original";

type DemoResponder = "owner" | "ana" | "luis" | "maria";

type ReactionSeed = { who: DemoResponder; reaction: "join" | "skip" | "maybe" };

/** IDs sintéticos solo para el viaje demo (lectura en API; no se insertan en auth.users). */
const DEMO_REACTION_USER_IDS: Record<DemoResponder, string> = {
  owner: "00000100-0000-4000-8000-000000000001",
  ana: "00000100-0000-4000-8000-000000000002",
  luis: "00000100-0000-4000-8000-000000000003",
  maria: "00000100-0000-4000-8000-000000000004",
};

const DISPLAY_NAMES: Record<DemoResponder, string> = {
  owner: "owner",
  ana: "Ana",
  luis: "Luis",
  maria: "María",
};

/** Respuestas RSVP por actividad (solo títulos con datos de ejemplo). */
export const DEMO_ATTENDANCE_BY_TITLE: Record<string, ReactionSeed[]> = {
  "St. James's Park": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "maybe" },
  ],
  "Buckingham Palace y cambio de guardia": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "skip" },
    { who: "maria", reaction: "join" },
  ],
  "Cena en The Anchor Bankside": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "skip" },
  ],
  "British Museum": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "maybe" },
    { who: "maria", reaction: "skip" },
  ],
  "Almuerzo en Dishoom": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
  "Tarde en Covent Garden": [
    { who: "owner", reaction: "maybe" },
    { who: "ana", reaction: "skip" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
  "Tower Bridge y Tower of London": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "maybe" },
  ],
  "Almuerzo en Brick Lane": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "skip" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
  "Musical en West End — El Rey León": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
  "Hyde Park y Kensington Gardens": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "maybe" },
    { who: "luis", reaction: "skip" },
    { who: "maria", reaction: "join" },
  ],
  "Llegada y check-in en el hotel": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
  "Paseo por Westminster y Big Ben": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "maybe" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "skip" },
  ],
  "Tate Modern": [
    { who: "owner", reaction: "maybe" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "skip" },
    { who: "maria", reaction: "maybe" },
  ],
  "Paseo nocturno por el Southbank": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "skip" },
    { who: "luis", reaction: "maybe" },
    { who: "maria", reaction: "join" },
  ],
  "Desayuno en Covent Garden": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "maybe" },
    { who: "maria", reaction: "skip" },
  ],
  "National Gallery": [
    { who: "owner", reaction: "skip" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "maybe" },
  ],
  "Mercado y cena en Borough Market": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "skip" },
    { who: "maria", reaction: "join" },
  ],
  "Churchill War Rooms": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "join" },
    { who: "luis", reaction: "maybe" },
    { who: "maria", reaction: "skip" },
  ],
  "Cena previa al musical": [
    { who: "owner", reaction: "join" },
    { who: "ana", reaction: "maybe" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
  "Victoria & Albert Museum": [
    { who: "owner", reaction: "maybe" },
    { who: "ana", reaction: "skip" },
    { who: "luis", reaction: "join" },
    { who: "maria", reaction: "join" },
  ],
};

/** Visibilidad / invitados por actividad (el resto queda en `all`). */
export const DEMO_INVITE_BY_TITLE: Record<
  string,
  { scope: ActivityInviteScope; invitedNames?: string[] }
> = {
  "Cena en The Anchor Bankside": { scope: "selected", invitedNames: ["Ana", "Luis"] },
  "Almuerzo en Brick Lane": { scope: "selected", invitedNames: ["Luis", "María"] },
  "Churchill War Rooms": { scope: "selected", invitedNames: ["Ana"] },
  "Desayuno en el hotel y salida": { scope: "self" },
};

export function isDemoTripForAttendance(trip: { is_demo?: boolean | null; name?: string | null }) {
  if (trip.is_demo) return true;
  const name = String(trip.name || "").trim();
  return name === DEMO_TRIP_NAME || name.startsWith("Demo ·");
}

export function buildDemoAttendanceReactions(
  tripId: string,
  activities: Array<{ id: string; title: string }>,
  ownerDisplayName: string
): ActivityReactionRow[] {
  const names: Record<DemoResponder, string> = {
    ...DISPLAY_NAMES,
    owner: ownerDisplayName.trim() || "Tú",
  };

  const rows: ActivityReactionRow[] = [];
  for (const act of activities) {
    const defs = DEMO_ATTENDANCE_BY_TITLE[act.title];
    if (!defs?.length) continue;
    for (const d of defs) {
      rows.push({
        id: `demo-rxn-${act.id}-${d.who}`,
        activity_id: act.id,
        user_id: DEMO_REACTION_USER_IDS[d.who],
        display_name: names[d.who],
        reaction: d.reaction,
        comment: null,
      });
    }
  }
  return rows;
}

export function getDemoInviteConfig(title: string) {
  return DEMO_INVITE_BY_TITLE[title] ?? { scope: "all" as const };
}
