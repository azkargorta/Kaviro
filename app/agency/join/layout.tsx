import { Suspense } from "react";

export default function AgencyJoinLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-[100dvh] bg-slate-100" />}>{children}</Suspense>;
}
