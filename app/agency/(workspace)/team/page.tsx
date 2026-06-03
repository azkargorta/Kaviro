import AgencyTeamPanel from "@/components/agency/AgencyTeamPanel";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyTeamPage() {
  const { agency, membership } = await requireAgencyContext("/agency/team");

  return <AgencyTeamPanel agencyName={agency.name} yourRole={membership.role} />;
}
