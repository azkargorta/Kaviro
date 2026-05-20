import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/referral/status
 * Returns the current user's referral code and stats.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, referral_months_earned, referred_by")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const p = profile as {
      referral_code?: string | null;
      referral_months_earned?: number | null;
      referred_by?: string | null;
    };

    return NextResponse.json({
      referralCode: p.referral_code ?? null,
      monthsEarned: p.referral_months_earned ?? 0,
      wasReferred: Boolean(p.referred_by),
      inviteUrl: p.referral_code
        ? `${process.env.NEXT_PUBLIC_SITE_URL || ""}/invite/${p.referral_code}`
        : null,
    });
  } catch (err) {
    console.error("Referral status error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
