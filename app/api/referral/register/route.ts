import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/referral/register
 * Called after a user registers via a referral link.
 * Awards 1 month Premium to both referrer and new user.
 * Body: { referralCode: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { referralCode } = await request.json() as { referralCode: string };
    if (!referralCode) return NextResponse.json({ error: "Missing referralCode" }, { status: 400 });

    // Find referrer
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, referral_months_earned")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    if (referrer.id === user.id) return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });

    // Check new user hasn't already been referred
    const { data: me } = await supabase
      .from("profiles")
      .select("referred_by, is_premium")
      .eq("id", user.id)
      .maybeSingle();

    if ((me as { referred_by?: string | null } | null)?.referred_by) {
      return NextResponse.json({ error: "Already referred" }, { status: 400 });
    }

    const now = new Date();
    const premiumUntil = new Date(now);
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);

    // Award new user: mark as referred + 1 month premium
    await supabase.from("profiles").update({
      referred_by: referralCode,
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
    }).eq("id", user.id);

    // Award referrer: +1 month premium
    const referrerMonths = ((referrer as { referral_months_earned?: number } | null)?.referral_months_earned ?? 0) + 1;
    const referrerPremiumUntil = new Date(now);
    referrerPremiumUntil.setMonth(referrerPremiumUntil.getMonth() + 1);

    await supabase.from("profiles").update({
      referral_months_earned: referrerMonths,
      is_premium: true,
      premium_until: referrerPremiumUntil.toISOString(),
    }).eq("id", referrer.id);

    return NextResponse.json({ ok: true, premiumUntil: premiumUntil.toISOString() });
  } catch (err) {
    logger.error("Referral register error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
