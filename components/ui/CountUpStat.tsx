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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

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
