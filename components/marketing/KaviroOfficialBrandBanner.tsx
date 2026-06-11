import Reveal from "@/components/ui/Reveal";
import { KAVIRO_OFFICIAL_SUMMARY } from "@/lib/kaviro-public-knowledge";

type Props = {
  className?: string;
};

export default function KaviroOfficialBrandBanner({ className }: Props) {
  return (
    <Reveal variant="fade" className={className ?? "mx-auto max-w-3xl"}>
      <div className="rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
          Información oficial resumida
        </p>
        <p className="mt-2 text-center text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
          {KAVIRO_OFFICIAL_SUMMARY}
        </p>
      </div>
    </Reveal>
  );
}
