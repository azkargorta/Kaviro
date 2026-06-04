import OpsAgencyDetailClient from "@/components/ops/OpsAgencyDetailClient";

type Props = { params: { agencyId: string } };

export default function OpsAgencyDetailPage({ params }: Props) {
  return <OpsAgencyDetailClient agencyId={params.agencyId} />;
}
