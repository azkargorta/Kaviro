import type { AgencyRow } from "@/lib/agency";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export function formatAgencyQuoteLabel(
  amountCents: number | null | undefined,
  currency = "eur"
): string | null {
  if (amountCents == null || !Number.isFinite(amountCents) || amountCents <= 0) return null;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function agencyHasCheckoutPrice(
  agency: Pick<AgencyRow, "stripe_price_id_monthly" | "billing_monthly_amount_cents">
): boolean {
  if (agency.stripe_price_id_monthly?.trim()) return true;
  if (typeof agency.billing_monthly_amount_cents === "number" && agency.billing_monthly_amount_cents > 0) {
    return true;
  }
  return Boolean(process.env.STRIPE_AGENCY_PRICE_ID_MONTHLY?.trim());
}

export async function createAgencyMonthlyStripePrice(input: {
  agencyId: string;
  agencyName: string;
  amountCents: number;
  currency?: string;
}): Promise<string> {
  const productId = process.env.STRIPE_AGENCY_PRODUCT_ID?.trim();
  if (!productId) {
    throw new Error("Falta STRIPE_AGENCY_PRODUCT_ID en el servidor (producto Stripe para Agency Pro).");
  }

  const cents = Math.round(input.amountCents);
  if (cents < 100) throw new Error("La tarifa mensual debe ser al menos 1 €.");

  const stripe = getStripe();
  const currency = (input.currency || "eur").toLowerCase();

  const price = await stripe.prices.create({
    product: productId,
    currency,
    unit_amount: cents,
    recurring: { interval: "month" },
    nickname: `Agency Pro — ${input.agencyName}`.slice(0, 120),
    metadata: {
      agency_id: input.agencyId,
      type: "agency_pro",
    },
  });

  return price.id;
}

/** Devuelve el Price ID de Stripe para el checkout (crea uno si hay importe pero falta price). */
export async function resolveAgencyCheckoutPriceId(
  agency: Pick<
    AgencyRow,
    "id" | "name" | "stripe_price_id_monthly" | "billing_monthly_amount_cents" | "billing_currency"
  >
): Promise<string> {
  const existing = agency.stripe_price_id_monthly?.trim();
  if (existing) return existing;

  const cents = agency.billing_monthly_amount_cents;
  if (typeof cents === "number" && cents > 0) {
    const priceId = await createAgencyMonthlyStripePrice({
      agencyId: agency.id,
      agencyName: agency.name,
      amountCents: cents,
      currency: agency.billing_currency || "eur",
    });

    const admin = createSupabaseAdmin();
    await admin
      .from("agencies")
      .update({
        stripe_price_id_monthly: priceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agency.id);

    return priceId;
  }

  const fallback = process.env.STRIPE_AGENCY_PRICE_ID_MONTHLY?.trim();
  if (fallback) return fallback;

  throw new Error(
    "Tu agencia aún no tiene tarifa asignada. Kaviro te enviará el importe acordado antes de activar el pago."
  );
}
