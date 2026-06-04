import { requireAgencyContext } from "@/lib/require-agency";
import AgencyOperationsCalendar from "@/components/agency/AgencyOperationsCalendar";
import { agencyPageSubtitleClass, agencyPageTitleClass } from "@/lib/agency-theme";

export default async function AgencyCalendarPage() {
  await requireAgencyContext("/agency/calendar");

  return (
    <div className="space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Calendario de operaciones</h1>
        <p className={agencyPageSubtitleClass}>
          Vista mensual de todos tus programas: fechas, estado y acceso rápido al viaje.
        </p>
      </div>
      <AgencyOperationsCalendar />
    </div>
  );
}
