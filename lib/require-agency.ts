import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, type AgencyMemberRow, type AgencyRow } from "@/lib/agency";

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
    redirect("/empresa?reason=no-membership");
  }

  return {
    supabase,
    userId: user.id,
    agency: ctx.agency,
    membership: ctx.membership,
  };
}
