import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, type AgencyMemberRow, type AgencyRow } from "@/lib/agency";

export type AgencyApiContext = {
  supabase: SupabaseClient;
  userId: string;
  agency: AgencyRow;
  membership: AgencyMemberRow;
};

/** APIs del panel Kaviro Trips: sesión + membresía de agencia obligatorias. */
export async function requireAgencyApiContext(): Promise<
  { ok: true; ctx: AgencyApiContext } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    };
  }

  const membership = await getAgencyForUser(supabase, user.id);
  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No tienes acceso a Kaviro Trips. Solicita acceso a tu agencia." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    ctx: {
      supabase,
      userId: user.id,
      agency: membership.agency,
      membership: membership.membership,
    },
  };
}
