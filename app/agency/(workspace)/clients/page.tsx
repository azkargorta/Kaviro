import AgencyClientsPanel from "@/components/agency/AgencyClientsPanel";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyClientsPage() {
  await requireAgencyContext("/agency/clients");
  return <AgencyClientsPanel />;
}
