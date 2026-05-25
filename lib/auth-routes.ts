/** Rutas de autenticación con `next` codificado de forma segura. */

export const PREMIUM_ACCOUNT_QUERY = "/account?upgrade=premium&focus=premium";
export const PREMIUM_UPGRADE_HREF = `${PREMIUM_ACCOUNT_QUERY}#premium-plans`;

export function buildLoginHref(nextPath = "/dashboard"): string {
  const safe = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  return `/auth/login?next=${encodeURIComponent(safe)}`;
}

/** Login → cuenta con sección Premium (sin hash en `next`; el scroll usa query params). */
export const PREMIUM_UPGRADE_LOGIN_HREF = buildLoginHref(PREMIUM_ACCOUNT_QUERY);

export function buildPremiumCheckoutLoginHref(plan: "monthly" | "yearly"): string {
  return buildLoginHref(`${PREMIUM_ACCOUNT_QUERY}&billing=checkout&plan=${plan}`);
}

export function buildBillingCheckoutHref(plan: "monthly" | "yearly"): string {
  return `/api/billing/checkout?plan=${plan}`;
}
