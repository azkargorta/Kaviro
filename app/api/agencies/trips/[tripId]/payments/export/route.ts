import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";

type Params = { params: { tripId: string } };

function csvEscape(v: string) {
  if (v.includes('"') || v.includes(",") || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: rows, error } = await gate.supabase
    .from("agency_participant_payments")
    .select(
      "participant_id, deposit_amount, final_amount, deposit_status, final_status, deposit_paid_at, final_paid_at"
    )
    .eq("trip_id", params.tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (rows ?? []).map((r) => r.participant_id as string);
  const { data: participants } = ids.length
    ? await gate.supabase.from("trip_participants").select("id, display_name, email").in("id", ids)
    : { data: [] };

  const names = new Map((participants ?? []).map((p) => [p.id as string, p]));

  const header = [
    "Viajero",
    "Email",
    "Señal",
    "Estado señal",
    "Pago final",
    "Estado final",
    "Fecha señal",
    "Fecha final",
  ];
  const lines = [header.map(csvEscape).join(",")];

  for (const r of rows ?? []) {
    const p = names.get(r.participant_id as string);
    lines.push(
      [
        p?.display_name ?? "",
        p?.email ?? "",
        String(r.deposit_amount),
        String(r.deposit_status),
        String(r.final_amount),
        String(r.final_status),
        r.deposit_paid_at ? new Date(r.deposit_paid_at as string).toISOString().slice(0, 10) : "",
        r.final_paid_at ? new Date(r.final_paid_at as string).toISOString().slice(0, 10) : "",
      ]
        .map((c) => csvEscape(String(c)))
        .join(",")
    );
  }

  return new NextResponse("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cobros-${params.tripId.slice(0, 8)}.csv"`,
    },
  });
}
