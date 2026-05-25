import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export type BillingPlan = "monthly" | "yearly";

export class BillingCheckoutAuthError extends Error {
  constructor(message = "No autenticado.") {
    super(message);
    this.name = "BillingCheckoutAuthError";
  }
}

function getPriceId(plan: BillingPlan) {
  const id = plan === "yearly" ? process.env.STRIPE_PRICE_ID_YEARLY : process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!id) throw new Error(`Falta STRIPE_PRICE_ID_${plan === "yearly" ? "YEARLY" : "MONTHLY"}.`);
  return id;
}

export function normalizeBillingPlan(value: unknown): BillingPlan {
  return value === "yearly" ? "yearly" : "monthly";
}

/** Crea sesión de Stripe Checkout y devuelve la URL de pago. */
export async function createStripeCheckoutSession(params: {
  origin: string;
  plan: BillingPlan;
}): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new BillingCheckoutAuthError(userError.message);
  if (!user) throw new BillingCheckoutAuthError();

  const priceId = getPriceId(params.plan);
  const stripe = getStripe();
  const admin = createSupabaseAdmin();

  const { data: customerRow } = await admin
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const email = user.email || undefined;
  const customerId =
    typeof (customerRow as { stripe_customer_id?: string } | null)?.stripe_customer_id === "string"
      ? String((customerRow as { stripe_customer_id: string }).stripe_customer_id)
      : null;

  const customer =
    customerId ||
    (
      await stripe.customers.create({
        email,
        metadata: { supabase_user_id: user.id },
      })
    ).id;

  if (!customerId) {
    await admin.from("billing_customers").upsert({
      user_id: user.id,
      stripe_customer_id: customer,
      updated_at: new Date().toISOString(),
    });
  }

  const success_url = `${params.origin}/account?billing=success`;
  const cancel_url = `${params.origin}/account?billing=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url,
    cancel_url,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    metadata: { supabase_user_id: user.id, plan: params.plan },
  });

  if (!session.url) throw new Error("Stripe no devolvió URL de checkout.");
  return session.url;
}
