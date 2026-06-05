import Link from "next/link";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyPlanPanel from "@/components/agency/AgencyPlanPanel";
import KaviroTripsLogo from "@/components/brand/KaviroTripsLogo";
import SignOutButton from "@/components/auth/SignOutButton";
import { agencyBtnSecondaryClass, KAVIRO_TRIPS_WORKSPACE_CLASS } from "@/lib/agency-theme";
import { agencyHasWorkspaceAccess } from "@/lib/agency-plan-access";

export default async function AgencyPlanPage() {
  const { agency } = await requireAgencyContext("/agency/plan");
  const workspaceActive = agencyHasWorkspaceAccess(agency);

  return (
    <div className={`${KAVIRO_TRIPS_WORKSPACE_CLASS} min-h-[100dvh] bg-slate-100 dark:bg-[#060a12]`}>
      <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <KaviroTripsLogo variant="onLight" size="sm" withWordmark />
          <div className="flex items-center gap-2">
            {workspaceActive ? (
              <Link href="/agency" className={`${agencyBtnSecondaryClass} text-xs`}>
                Volver al panel
              </Link>
            ) : null}
            <SignOutButton className="text-xs" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{agency.name}</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Plan y facturación</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Prueba gratuita, Agency Pro o acuerdo partnership.
          </p>
        </div>
        <AgencyPlanPanel />
      </main>
    </div>
  );
}
