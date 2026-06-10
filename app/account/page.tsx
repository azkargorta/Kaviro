import { redirect } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import TripBoardPremiumHero from "@/components/layout/TripBoardPremiumHero";
import AccountSettingsForm from "@/components/account/AccountSettingsForm";
import ProfileAvatarPicker from "@/components/account/ProfileAvatarPicker";
import AccountReferralsSection from "@/components/account/AccountReferralsSection";
import AccountDeleteSection from "@/components/account/AccountDeleteSection";
import AccountTravelMatesSection from "@/components/account/AccountTravelMatesSection";
import PushNotificationsSection from "@/components/account/PushNotificationsSection";
import Link from "next/link";
import { getMonthlyAiBudgetEur, monthKeyUtc } from "@/lib/ai-usage";
import {
  resolveAccountPremium,
  type BillingSubscriptionSnapshot,
  type ProfilePremiumSnapshot,
} from "@/lib/entitlements";
import { syncProfileUsernameIfMissing } from "@/lib/profile-username";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/account");

  const admin = createSupabaseAdmin();
  const [{ data: profileRow }, { data: subRow }] = await Promise.all([
    admin.from("profiles").select("username, email, is_premium, premium_until").eq("id", user.id).maybeSingle(),
    admin
      .from("billing_subscriptions")
      .select("status, current_period_end, cancel_at_period_end, price_id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRow as ProfilePremiumSnapshot & {
    username?: string | null;
    email?: string | null;
  } | null;

  const username = await syncProfileUsernameIfMissing(admin, user.id, profile, user);
  const email = user.email || (typeof profile?.email === "string" ? profile.email : "");
  const sub = subRow as BillingSubscriptionSnapshot & {
    status?: string;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
  } | null;
  const isPremium = resolveAccountPremium(profile, sub);
  const premiumUntilRaw = profile?.premium_until;
  const premiumUntil =
    typeof premiumUntilRaw === "string" && premiumUntilRaw
      ? new Date(premiumUntilRaw).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
  const renewalDate =
    sub?.current_period_end && !Number.isNaN(Date.parse(sub.current_period_end))
      ? new Date(sub.current_period_end).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const monthKey = monthKeyUtc();
  const monthlyBudgetEur = getMonthlyAiBudgetEur();
  let estimatedCostEur = 0;
  let usagePct = 0;
  if (isPremium) {
    const { data: usageRow } = await supabase
      .from("user_ai_usage_monthly")
      .select("estimated_cost_eur")
      .eq("user_id", user.id)
      .eq("month_key", monthKey)
      .eq("provider", "gemini")
      .maybeSingle();
    estimatedCostEur = usageRow?.estimated_cost_eur != null ? Number(usageRow.estimated_cost_eur) : 0;
    if (!Number.isFinite(estimatedCostEur)) estimatedCostEur = 0;
    usagePct = monthlyBudgetEur > 0 ? Math.min(100, Math.max(0, (estimatedCostEur / monthlyBudgetEur) * 100)) : 0;
  }

  return (
    <main className="page-shell page-shell--safe-top">
      <div className="mx-auto max-w-4xl space-y-8">
      <div className="mb-4"><BackButton /></div>
      <TripBoardPremiumHero
        eyebrow="Cuenta"
        title="Tu cuenta"
        description="Gestiona tu plan, credenciales y nombre de usuario."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Precios
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Volver al dashboard
            </Link>
          </div>
        }
      />

      <section className="card-soft p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resumen del plan</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{isPremium ? "Premium" : "Gratis"}</p>
        {isPremium && renewalDate ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {sub?.cancel_at_period_end
              ? `Acceso Premium hasta el ${renewalDate} (cancelación programada).`
              : `Próxima renovación o fin de periodo: ${renewalDate}.`}
          </p>
        ) : null}
        {isPremium && premiumUntil && !renewalDate ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Premium activo hasta el {premiumUntil}.</p>
        ) : null}
        {!isPremium ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Puedes pasar a Premium desde la sección de planes más abajo.
          </p>
        ) : (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-[#334155]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Uso de IA este mes</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mes: {monthKey}</p>
              </div>
              <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200">
                {Math.round(usagePct)}%
              </div>
            </div>
            <div className="mt-3">
              <div className="h-4 w-full overflow-hidden rounded-full border border-slate-200 bg-emerald-100 dark:border-[#1E293B] dark:bg-[#1E293B]">
                <div className="h-full bg-rose-500" style={{ width: `${usagePct}%` }} aria-hidden />
              </div>
              {usagePct >= 100 ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                  <span className="font-semibold">Has alcanzado el límite mensual de IA.</span> El asistente y el analizador de
                  documentos quedan deshabilitados hasta el mes siguiente.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <ProfileAvatarPicker />

      <AccountTravelMatesSection />

      <AccountSettingsForm initial={{ username, email, isPremium }} />

      <section className="card-soft p-6">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
          Notificaciones
        </h2>
        <div className="mt-4">
          <PushNotificationsSection />
        </div>
      </section>

      <AccountReferralsSection />

      <AccountDeleteSection />
      </div>
    </main>
  );
}

