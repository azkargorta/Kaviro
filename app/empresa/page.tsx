import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import EmpresaLanding from "@/components/empresa/EmpresaLanding";
import { APP_NAME, KAVIRO_TRIPS_PRODUCT_NAME, KAVIRO_TRIPS_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${KAVIRO_TRIPS_PRODUCT_NAME} | ${APP_NAME}`,
  description: KAVIRO_TRIPS_TAGLINE,
};

type Props = {
  searchParams?: { reason?: string };
};

export default async function EmpresaLandingPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAgency = false;
  if (user) {
    const ctx = await getAgencyForUser(supabase, user.id);
    hasAgency = Boolean(ctx);
  }

  return (
    <EmpresaLanding
      hasAgency={hasAgency}
      isLoggedIn={Boolean(user)}
      reason={searchParams?.reason}
    />
  );
}
