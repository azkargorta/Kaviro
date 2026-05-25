import { NextResponse } from "next/server";
import {
  BillingCheckoutAuthError,
  createStripeCheckoutSession,
  normalizeBillingPlan,
} from "@/lib/billing-checkout";
import { buildPremiumCheckoutLoginHref } from "@/lib/auth-routes";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/billing/checkout?plan=monthly|yearly
 * Redirección completa del navegador → Stripe (más fiable en móvil que fetch + assign).
 */
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const plan = normalizeBillingPlan(requestUrl.searchParams.get("plan"));
  const origin = requestUrl.origin;

  try {
    const checkoutUrl = await createStripeCheckoutSession({ origin, plan });
    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    if (error instanceof BillingCheckoutAuthError) {
      return NextResponse.redirect(new URL(buildPremiumCheckoutLoginHref(plan), origin));
    }

    const account = new URL("/account", origin);
    account.searchParams.set("billing", "error");
    account.searchParams.set(
      "message",
      error instanceof Error ? error.message : "No se pudo iniciar el pago."
    );
    return NextResponse.redirect(account);
  }
}

/** POST JSON — compatibilidad con clientes que ya usan fetch. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const plan = normalizeBillingPlan(body?.plan);
    const origin = new URL(req.url).origin;
    const checkoutUrl = await createStripeCheckoutSession({ origin, plan });
    return NextResponse.json({ url: checkoutUrl }, { status: 200 });
  } catch (error) {
    if (error instanceof BillingCheckoutAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar el checkout." },
      { status: 500 }
    );
  }
}
