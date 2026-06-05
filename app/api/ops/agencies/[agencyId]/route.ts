import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { getPlatformAgencyDetail } from "@/lib/server/platform-ops-data";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createAgencyMonthlyStripePrice } from "@/lib/server/agency-custom-pricing";
type Params = { params: { agencyId: string } };

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_platform_ops.sql" });
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  try {
    const detail = await getPlatformAgencyDetail(params.agencyId);
    if (!detail) return NextResponse.json({ error: "Agencia no encontrada." }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("platform_crm_notes")) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const admin = createSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body?.plan === "string") patch.plan = body.plan;
  if (typeof body?.maxMembers === "number") patch.max_members = body.maxMembers;
  if (body?.contactEmail !== undefined) {
    patch.contact_email = body.contactEmail === "" ? null : String(body.contactEmail).trim();
  }
  if (body?.billingQuoteNotes !== undefined) {
    patch.billing_quote_notes =
      body.billingQuoteNotes === "" ? null : String(body.billingQuoteNotes).trim().slice(0, 500);
  }

  const billingMonthlyEur =
    typeof body?.billingMonthlyEur === "number"
      ? body.billingMonthlyEur
      : typeof body?.billingMonthlyEur === "string"
        ? Number.parseFloat(body.billingMonthlyEur)
        : null;

  if (billingMonthlyEur != null && Number.isFinite(billingMonthlyEur)) {
    const cents = Math.round(billingMonthlyEur * 100);
    if (cents < 100) {
      return NextResponse.json({ error: "La tarifa mensual debe ser al menos 1 €." }, { status: 400 });
    }

    const { data: agencyRow } = await admin
      .from("agencies")
      .select("id, name, billing_currency")
      .eq("id", params.agencyId)
      .maybeSingle();

    if (!agencyRow?.id) {
      return NextResponse.json({ error: "Agencia no encontrada." }, { status: 404 });
    }

    try {
      const priceId = await createAgencyMonthlyStripePrice({
        agencyId: params.agencyId,
        agencyName: (agencyRow.name as string) || "Agencia",
        amountCents: cents,
        currency: (agencyRow.billing_currency as string) || "eur",
      });
      patch.billing_monthly_amount_cents = cents;
      patch.stripe_price_id_monthly = priceId;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo crear el precio en Stripe." },
        { status: 500 }
      );
    }
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const { error } = await admin.from("agencies").update(patch).eq("id", params.agencyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return GET(req, { params });
}
