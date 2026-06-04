import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import { formatMoney, type PaymentPhase } from "@/lib/agency/payments";
import {
  agencyPaymentsAppOrigin,
  createAgencyTripCheckoutSession,
} from "@/lib/server/agency-trip-payment";

type Params = { params: { token: string } };

async function loadByToken(token: string) {
  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("agency_participant_payments")
    .select("*")
    .or(`pay_token_deposit.eq.${token},pay_token_final.eq.${token}`)
    .maybeSingle();

  if (!row) return null;

  const phase: PaymentPhase = row.pay_token_deposit === token ? "deposit" : "final";
  const amount = phase === "deposit" ? Number(row.deposit_amount) : Number(row.final_amount);
  const status = phase === "deposit" ? row.deposit_status : row.final_status;
  const paidAt = phase === "deposit" ? row.deposit_paid_at : row.final_paid_at;

  const [{ data: trip }, { data: participant }, { data: agency }] = await Promise.all([
    admin.from("trips").select("name, agency_payment_currency").eq("id", row.trip_id).maybeSingle(),
    admin.from("trip_participants").select("display_name").eq("id", row.participant_id).maybeSingle(),
    admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", row.agency_id)
      .maybeSingle(),
  ]);

  const branding = agency
    ? agencyBrandingFromRow(agency as AgencyRow)
    : agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);

  return {
    row,
    phase,
    amount,
    status,
    paidAt,
    trip,
    participant,
    branding,
    currency: (trip?.agency_payment_currency as string) || "EUR",
    tripName: trip?.name ?? "Viaje",
    travelerName: participant?.display_name ?? "Viajero",
  };
}

export async function GET(_req: Request, { params }: Params) {
  const loaded = await loadByToken(params.token);
  if (!loaded) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });

  return NextResponse.json({
    phase: loaded.phase,
    phaseLabel: loaded.phase === "deposit" ? "Señal" : "Pago final",
    amount: loaded.amount,
    amountLabel: formatMoney(loaded.amount, loaded.currency),
    status: loaded.status,
    paid: loaded.status === "paid",
    tripName: loaded.tripName,
    travelerName: loaded.travelerName,
    branding: loaded.branding,
  });
}

export async function POST(req: Request, { params }: Params) {
  const loaded = await loadByToken(params.token);
  if (!loaded) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  if (loaded.status === "paid") {
    return NextResponse.json({ error: "Este pago ya está completado." }, { status: 409 });
  }

  const origin =
    (await req.json().catch(() => ({})))?.origin ||
    req.headers.get("origin") ||
    agencyPaymentsAppOrigin();

  try {
    const url = await createAgencyTripCheckoutSession({
      tripId: loaded.row.trip_id as string,
      participantId: loaded.row.participant_id as string,
      phase: loaded.phase,
      origin,
    });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo iniciar el pago." },
      { status: 500 }
    );
  }
}
