import type { ReactNode } from "react";

/** Layout raíz de /agency: el panel exige membresía en (workspace); /agency/join queda público (con sesión). */
export default function AgencyRootLayout({ children }: { children: ReactNode }) {
  return children;
}
