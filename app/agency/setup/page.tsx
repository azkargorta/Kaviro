import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import AgencySetupForm from "@/components/agency/AgencySetupForm";
import KaviroTripsLogo from "@/components/brand/KaviroTripsLogo";
import { agencyBtnSecondaryClass, KAVIRO_TRIPS_WORKSPACE_CLASS } from "@/lib/agency-theme";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

export default async function AgencySetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?mode=agency&next=/agency/setup");
  }

  const ctx = await getAgencyForUser(supabase, user.id);
  if (ctx) redirect("/agency");

  return (
    <div
      className={`${KAVIRO_TRIPS_WORKSPACE_CLASS} min-h-[100dvh] bg-slate-100 px-4 py-10 dark:bg-[#060a12]`}
    >
      <div className="mx-auto max-w-lg text-center">
        <KaviroTripsLogo variant="onLight" size="sm" withWordmark className="mx-auto" />
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Crea tu agencia</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Configura tu workspace de {KAVIRO_TRIPS_PRODUCT_NAME} en menos de un minuto.
        </p>
      </div>
      <div className="mx-auto mt-8 max-w-lg">
        <AgencySetupForm defaultEmail={user.email} />
        <p className="mt-4 text-center text-xs text-slate-500">
          ¿Ya tienes invitación de equipo?{" "}
          <Link href="/agency/join" className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            Aceptar invitación
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/empresa" className={`${agencyBtnSecondaryClass} inline-flex text-xs`}>
            Volver
          </Link>
        </p>
      </div>
    </div>
  );
}
