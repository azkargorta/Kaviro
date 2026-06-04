import AgencyFinancePanel from "@/components/agency/AgencyFinancePanel";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyFinancePage() {
  await requireAgencyContext("/agency/finance");
  return <AgencyFinancePanel />;
}
