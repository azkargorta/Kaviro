import Link from "next/link";

type Props = {
  eyebrow?: string;
  icon?: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryText?: string;
};

export default function TripEmptyModuleGuide({
  eyebrow = "Empieza aquí",
  icon = "→",
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryText,
}: Props) {
  return (
    <section className="rounded-2xl border border-[var(--brand-border)]/65 bg-gradient-to-br from-[var(--brand-light)]/65 via-white to-white p-4 shadow-sm dark:via-[#0F1623] dark:to-[#0F1623] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-border)]/60 bg-white text-xl shadow-sm dark:bg-[#141c2b]" aria-hidden>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">{eyebrow}</p>
            <h2 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
            {secondaryText ? (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{secondaryText}</p>
            ) : null}
          </div>
        </div>
        <Link
          href={primaryHref}
          className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          {primaryLabel} →
        </Link>
      </div>
    </section>
  );
}
