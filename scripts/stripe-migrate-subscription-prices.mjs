/**
 * Migra suscripciones activas de Price antiguos a Price nuevos en Stripe.
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_... node scripts/stripe-migrate-subscription-prices.mjs \
 *     --old-monthly=price_xxx --new-monthly=price_yyy \
 *     --old-yearly=price_aaa --new-yearly=price_bbb \
 *     --dry-run
 *
 * --prorate  → proration_behavior create_prorations (cobro/abono ya)
 * sin flag   → proration_behavior none (nuevo precio en la próxima renovación)
 */

import Stripe from "stripe";

function parseArgs(argv) {
  const out = { dryRun: false, prorate: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--prorate") out.prorate = true;
    else if (a.startsWith("--old-monthly=")) out.oldMonthly = a.slice("--old-monthly=".length);
    else if (a.startsWith("--new-monthly=")) out.newMonthly = a.slice("--new-monthly=".length);
    else if (a.startsWith("--old-yearly=")) out.oldYearly = a.slice("--old-yearly=".length);
    else if (a.startsWith("--new-yearly=")) out.newYearly = a.slice("--new-yearly=".length);
  }
  return out;
}

function mapPrice(oldMonthly, newMonthly, oldYearly, newYearly, currentPriceId) {
  if (oldMonthly && newMonthly && currentPriceId === oldMonthly) return newMonthly;
  if (oldYearly && newYearly && currentPriceId === oldYearly) return newYearly;
  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) {
    console.error("Falta STRIPE_SECRET_KEY en el entorno.");
    process.exit(1);
  }
  if (!args.newMonthly && !args.newYearly) {
    console.error("Indica al menos --new-monthly= o --new-yearly=.");
    process.exit(1);
  }
  if (!args.oldMonthly && !args.oldYearly) {
    console.error("Indica al menos --old-monthly= o --old-yearly= para saber qué migrar.");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const proration = args.prorate ? "create_prorations" : "none";

  let updated = 0;
  let skipped = 0;
  let startingAfter;

  console.log(`Modo: ${args.dryRun ? "DRY-RUN" : "APLICAR"} | proration: ${proration}`);

  while (true) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      starting_after: startingAfter,
    });

    for (const sub of page.data) {
      const item = sub.items?.data?.[0];
      if (!item?.id || !item.price?.id) {
        skipped++;
        continue;
      }
      const nextPrice = mapPrice(
        args.oldMonthly,
        args.newMonthly,
        args.oldYearly,
        args.newYearly,
        item.price.id
      );
      if (!nextPrice) {
        skipped++;
        continue;
      }

      console.log(
        `${args.dryRun ? "[dry-run] " : ""}${sub.id} ${item.price.id} → ${nextPrice} (customer ${sub.customer})`
      );

      if (!args.dryRun) {
        await stripe.subscriptions.update(sub.id, {
          items: [{ id: item.id, price: nextPrice }],
          proration_behavior: proration,
        });
      }
      updated++;
    }

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  console.log(`Listo. ${updated} suscripción(es) ${args.dryRun ? "a migrar" : "migradas"}, ${skipped} omitidas (otro price o sin ítem).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
