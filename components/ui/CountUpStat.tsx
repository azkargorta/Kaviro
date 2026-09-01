"use client";

import { useEffect, useRef, useState } from "react";

type CountUpStatProps = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
};

export default function CountUpStat({
  value,
  label,
  prefix = "",
  suffix = "",
  valueClassName = "text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white",
  labelClassName = "mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400",
  className = "text-center",
}: CountUpStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Render the real value in the initial HTML so crawlers, previews and
  // no-JS clients never see a misleading 0. The count-up is progressive
  // enhancement applied only after hydration in the browser.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setDisplay(value);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        setDisplay(0);
        const duration = 650;
        const start = performance.now();

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) ** 3;
          setDisplay(Math.round(value * eased));
          if (t < 1) rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [value]);

  return (
    <div ref={ref} className={className}>
      <div className={valueClassName}>
        {prefix}
        {display}
        {suffix}
      </div>
      <div className={labelClassName}>{label}</div>
    </div>
  );
}
