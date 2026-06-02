import AgencyBrandingForm from "@/components/agency/AgencyBrandingForm";
import { agencyBrandingFromRow } from "@/lib/agency";
import { canManageAgencyBranding } from "@/lib/agency-branding";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyBrandingPage() {
  const { agency, membership, userId } = await requireAgencyContext("/agency/branding");
  const branding = agencyBrandingFromRow(agency);
  const canEdit = canManageAgencyBranding(agency, membership, userId);

  return (
    <AgencyBrandingForm agencySlug={agency.slug} initial={branding} canEdit={canEdit} />
  );
}
