import AgencyShell from "@/components/agency/AgencyShell";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { agency } = await requireAgencyContext();
  return <AgencyShell agency={agency}>{children}</AgencyShell>;
}
