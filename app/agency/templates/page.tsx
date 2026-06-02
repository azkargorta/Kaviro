import AgencyTemplatesPanel from "@/components/agency/AgencyTemplatesPanel";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyTemplatesPage() {
  const { supabase, agency } = await requireAgencyContext("/agency/templates");

  const { data: trips } = await supabase
    .from("trips")
    .select("id, name")
    .eq("agency_id", agency.id)
    .order("name", { ascending: true });

  return (
    <AgencyTemplatesPanel
      agencySlug={agency.slug}
      trips={(trips ?? []).map((t) => ({ id: t.id as string, name: t.name as string | null }))}
    />
  );
}
