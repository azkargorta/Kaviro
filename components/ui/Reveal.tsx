"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

export type RevealVariant = "slide" | "fade" | "scale" | "left" | "right";
export type RevealDelay = 0 | 1 | 2 | 3 | 4;

const VARIANT_CLASS: Record<RevealVariant, string> = {
  slide: "motion-reveal",
  fade: "motion-reveal-fade",
  scale: "motion-reveal-scale",
  left: "motion-reveal-left",
  right: "motion-reveal-right",
};

type RevealProps = {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: RevealDelay;
  className?: string;
  as?: ElementType;
  id?: string;
};

export default function Reveal({
  children,
  variant = "slide",
  delay = 0,
  className = "",
  as: Tag = "div",
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay > 0 ? `motion-delay-${delay}` : "";
  const classes = [
    VARIANT_CLASS[variant],
    visible ? "motion-visible" : "",
    delayClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref as never} id={id} className={classes}>
      {children}
    </Tag>
  );
}
