import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, type AgencyMemberRow, type AgencyRow } from "@/lib/agency";
import { agencyHasWorkspaceAccess } from "@/lib/agency-plan-access";

export type AgencyContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  agency: AgencyRow;
  membership: AgencyMemberRow;
};

/** Requiere sesión + membresía de agencia; si no, redirige a /empresa o login. */
export async function requireAgencyContext(loginNext = "/agency"): Promise<AgencyContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?mode=agency&next=${encodeURIComponent(loginNext)}`);
  }

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) {
    redirect("/agency/setup");
  }

  return {
    supabase,
    userId: user.id,
    agency: ctx.agency,
    membership: ctx.membership,
  };
}

/** Panel operativo: exige además plan activo (trial vigente, Pro, partnership…). */
export async function requireAgencyWorkspaceContext(loginNext = "/agency"): Promise<AgencyContext> {
  const ctx = await requireAgencyContext(loginNext);
  if (!agencyHasWorkspaceAccess(ctx.agency)) {
    redirect("/agency/plan?reason=plan-inactive");
  }
  return ctx;
}
