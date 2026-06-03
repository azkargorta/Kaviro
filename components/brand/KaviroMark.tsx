/** Icono Kaviro: coral (B2C) o navy (Kaviro Trips). */

export const KAVIRO_MARK_CORAL = "#F87171";
export const KAVIRO_MARK_NAVY = "#1e3a5f";

const MARK_SRC = {
  coral: "/brand/icon.png",
  navy: "/brand/kaviro-mark-navy.svg",
} as const;

type Props = {
  size?: number;
  className?: string;
  title?: string;
  variant?: "coral" | "navy";
};

export default function KaviroMark({
  size = 48,
  className = "",
  title,
  variant = "coral",
}: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG/PNG escalable
    <img
      src={MARK_SRC[variant]}
      width={size}
      height={size}
      className={className}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    />
  );
}
