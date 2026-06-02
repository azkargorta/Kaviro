import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyTeamPage() {
  const { agency, membership } = await requireAgencyContext("/agency/team");

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">Equipo</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Invita coordinadores con rol editor o admin. (UI de invitaciones en el Bloque 2b — próximamente.)
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <p>
          <span className="font-semibold">Tu rol:</span> {membership.role}
        </p>
        <p className="mt-2">
          <span className="font-semibold">Agencia:</span> {agency.name}
        </p>
      </div>
    </div>
  );
}
