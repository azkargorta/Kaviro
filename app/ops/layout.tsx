import OpsShell from "@/components/ops/OpsShell";
import { requireOpsPage } from "@/lib/require-ops-page";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  await requireOpsPage("/ops");
  return <OpsShell>{children}</OpsShell>;
}
