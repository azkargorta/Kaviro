import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import { getStripe } from "@/lib/stripe";
import { agencyHasCheckoutPrice, resolveAgencyCheckoutPriceId } from "@/lib/server/agency-custom-pricing";

export class AgencyBillingAuthError extends Error {
  constructor(message = "No autenticado.") {
    super(message);
    this.name = "AgencyBillingAuthError";
  }
}

export class AgencyBillingConfigError extends Error {
  constructor(message = "Checkout de agencia no configurado.") {
    super(message);
    this.name = "AgencyBillingConfigError";
  }
}

/** Crea sesión Stripe Checkout para suscripción Agency Pro (precio por agencia). */
export async function createAgencyProCheckoutSession(params: { origin: string }): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new AgencyBillingAuthError(userError.message);
  if (!user) throw new AgencyBillingAuthError();

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) throw new AgencyBillingAuthError("Necesitas crear tu agencia primero.");

  const agency = ctx.agency;
  if (!agencyHasCheckoutPrice(agency)) {
    throw new AgencyBillingConfigError(
      "Tu agencia aún no tiene tarifa asignada. Contacta con Kaviro para acordar el importe mensual."
    );
  }

  const priceId = await resolveAgencyCheckoutPriceId(agency);
  const stripe = getStripe();

  let customerId = agency.stripe_customer_id || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: agency.name,
      metadata: {
        supabase_user_id: user.id,
        agency_id: agency.id,
        type: "agency_pro",
      },
    });
    customerId = customer.id;
    await supabase
      .from("agencies")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", agency.id);
  }

  const success_url = `${params.origin}/agency/plan?billing=success`;
  const cancel_url = `${params.origin}/agency/plan?billing=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url,
    cancel_url,
    metadata: {
      type: "agency_pro",
      agency_id: agency.id,
      supabase_user_id: user.id,
    },
    subscription_data: {
      metadata: {
        type: "agency_pro",
        agency_id: agency.id,
        supabase_user_id: user.id,
      },
    },
  });

  if (!session.url) throw new Error("Stripe no devolvió URL de checkout.");
  return session.url;
}
