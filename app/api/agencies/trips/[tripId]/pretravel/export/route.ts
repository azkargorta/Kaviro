import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";

type Params = { params: { tripId: string } };

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: fields } = await gate.supabase
    .from("agency_pretravel_survey_fields")
    .select("field_key, label")
    .eq("trip_id", params.tripId)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  const { data: responses } = await gate.supabase
    .from("agency_pretravel_responses")
    .select("participant_id, answers, submitted_at")
    .eq("trip_id", params.tripId)
    .not("submitted_at", "is", null);

  const participantIds = (responses ?? []).map((r) => r.participant_id as string);
  const { data: participants } = participantIds.length
    ? await gate.supabase
        .from("trip_participants")
        .select("id, display_name, email")
        .in("id", participantIds)
    : { data: [] };

  const nameById = new Map(
    (participants ?? []).map((p) => [p.id as string, { name: p.display_name, email: p.email }])
  );

  const fieldList = fields ?? [];
  const headers = ["Viajero", "Email", "Enviado el", ...fieldList.map((f) => f.label as string)];
  const rows: string[] = [headers.map(csvEscape).join(",")];

  for (const r of responses ?? []) {
    const meta = nameById.get(r.participant_id as string);
    const answers = (r.answers ?? {}) as Record<string, string>;
    const cells = [
      meta?.name ?? "",
      meta?.email ?? "",
      r.submitted_at ? new Date(r.submitted_at as string).toISOString().slice(0, 10) : "",
      ...fieldList.map((f) => String(answers[f.field_key as string] ?? "")),
    ];
    rows.push(cells.map((c) => csvEscape(String(c))).join(","));
  }

  const csv = "\uFEFF" + rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pretravel-${params.tripId.slice(0, 8)}.csv"`,
    },
  });
}
