import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { getDefaultHomePathForUser } from "@/lib/agency-default-route";
import { defaultLoginNext, parseWorkspaceModeParam } from "@/lib/workspace-mode";

type Props = {
  searchParams?: { next?: string; mode?: string };
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mode = parseWorkspaceModeParam(searchParams?.mode);

  if (user) {
    const next = searchParams?.next;
    if (mode === "agency" && !(await getAgencyForUser(supabase, user.id))) {
      redirect("/empresa?reason=no-membership");
    }
    const dest = await getDefaultHomePathForUser(supabase, user.id, next ?? defaultLoginNext(mode));
    redirect(dest);
  }

  const isAgency = mode === "agency";

  return (
    <AuthShell
      variant={isAgency ? "agency" : "personal"}
      title={isAgency ? KAVIRO_TRIPS_PRODUCT_NAME : "Iniciar sesión"}
      subtitle={
        isAgency
          ? "Accede al panel de tu organización"
          : "Accede a tu cuenta de Kaviro"
      }
    >
      <LoginForm />
    </AuthShell>
  );
}