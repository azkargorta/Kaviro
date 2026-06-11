import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function TripModuleIntro({ title, description, icon, actions, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 p-4 shadow-[0_4px_16px_rgba(248,113,113,0.08)] sm:p-5 dark:from-[#1a0f0f]/35 dark:via-[#0F1623] dark:to-[#080C14] ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b]">
            {icon ?? <Sparkles className="h-5 w-5" aria-hidden />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-text)]">Asistente del viaje</p>
            <h2 className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
