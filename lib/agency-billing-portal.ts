import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import { getStripe } from "@/lib/stripe";

export class AgencyBillingPortalError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AgencyBillingPortalError";
    this.status = status;
  }
}

export async function createAgencyBillingPortalSession(params: { origin: string }): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AgencyBillingPortalError("No autenticado.", 401);

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) throw new AgencyBillingPortalError("Sin agencia.", 403);

  const customerId = ctx.agency.stripe_customer_id?.trim() || null;
  if (!customerId) {
    throw new AgencyBillingPortalError("Aún no hay suscripción Stripe para gestionar.", 400);
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${params.origin}/agency/plan`,
  });

  if (!portal.url) throw new AgencyBillingPortalError("Stripe no devolvió URL del portal.", 500);
  return portal.url;
}
