/** Estado de integraciones (solo presencia de env, sin exponer secretos). */
export function getOpsIntegrationsHealth() {
  const stripeSecret = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const stripeWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const stripeAgencyProduct = Boolean(process.env.STRIPE_AGENCY_PRODUCT_ID?.trim());
  const resend = Boolean(process.env.RESEND_API_KEY?.trim());
  const appUrl = Boolean(
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  );
  const adminEmails = Boolean(
    process.env.KAVIRO_ADMIN_EMAILS?.trim() || process.env.TRIPBOARD_ADMIN_EMAILS?.trim()
  );
  const upstashRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );

  const agencyProReady = stripeSecret && stripeWebhook && stripeAgencyProduct && appUrl;

  return {
    stripeSecret,
    stripeWebhook,
    stripeAgencyProduct,
    resend,
    appUrl,
    adminEmails,
    upstashRedis,
    agencyProReady,
  };
}
