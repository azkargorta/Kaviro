import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  eyebrow?: string;
  variant?: "coral" | "white";
  className?: string;
};

export default function TripHighlightCard({
  children,
  eyebrow,
  variant = "coral",
  className = "",
}: Props) {
  const shell =
    variant === "coral"
      ? "rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 p-5 shadow-[0_4px_18px_rgba(248,113,113,0.12)] ring-1 ring-[var(--brand-border)]/30 dark:from-[#1a0f0f]/40 dark:via-[#0F1623] dark:to-[#080C14]"
      : "rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:border-[#1E293B] dark:bg-[#0F1623]";

  return (
    <div className={`${shell} ${className}`}>
      {eyebrow ? (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-text)]">{eyebrow}</p>
      ) : null}
      {children}
    </div>
  );
}
