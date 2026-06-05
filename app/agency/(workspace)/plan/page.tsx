import { requireAgencyContext } from "@/lib/require-agency";
import AgencyPlanPanel from "@/components/agency/AgencyPlanPanel";

export default async function AgencyPlanPage() {
  await requireAgencyContext("/agency/plan");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Plan y facturación</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Prueba gratuita, Agency Pro o acuerdo partnership.
        </p>
      </div>
      <AgencyPlanPanel />
    </div>
  );
}
