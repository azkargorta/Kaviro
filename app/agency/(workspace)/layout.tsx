import type { Metadata } from "next";
import AgencyShell from "@/components/agency/AgencyShell";
import { requireAgencyContext } from "@/lib/require-agency";
import { APP_NAME, KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${KAVIRO_TRIPS_PRODUCT_NAME} | ${APP_NAME}`,
};

export default async function AgencyWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { agency } = await requireAgencyContext();
  return <AgencyShell agency={agency}>{children}</AgencyShell>;
}
