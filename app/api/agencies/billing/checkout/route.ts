import { NextResponse } from "next/server";
import {
  AgencyBillingAuthError,
  AgencyBillingConfigError,
  createAgencyProCheckoutSession,
} from "@/lib/agency-billing-checkout";

export const runtime = "nodejs";

/** GET → redirección a Stripe Checkout (Agency Pro). */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  try {
    const url = await createAgencyProCheckoutSession({ origin });
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof AgencyBillingAuthError) {
      return NextResponse.redirect(
        new URL(`/auth/login?mode=agency&next=${encodeURIComponent("/agency/plan")}`, origin)
      );
    }
    const plan = new URL("/agency/plan", origin);
    plan.searchParams.set("billing", "error");
    plan.searchParams.set(
      "message",
      error instanceof AgencyBillingConfigError
        ? "El pago online aún no está activo. Escríbenos para activar tu cuenta."
        : error instanceof Error
          ? error.message
          : "No se pudo iniciar el pago."
    );
    return NextResponse.redirect(plan);
  }
}

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const url = await createAgencyProCheckoutSession({ origin });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof AgencyBillingAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof AgencyBillingConfigError
            ? "Checkout de agencia no configurado."
            : error instanceof Error
              ? error.message
              : "No se pudo iniciar el checkout.",
      },
      { status: error instanceof AgencyBillingConfigError ? 503 : 500 }
    );
  }
}
