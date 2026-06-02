import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import EmpresaLanding from "@/components/empresa/EmpresaLanding";

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
