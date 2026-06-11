import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TRIP_ACTION_PRIMARY, TRIP_ACTION_SECONDARY } from "@/components/trip/ui/trip-ui-classes";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function TripActionButton({ children, variant = "primary", className = "", ...rest }: Props) {
  const base = variant === "primary" ? TRIP_ACTION_PRIMARY : TRIP_ACTION_SECONDARY;
  return (
    <button type="button" className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}
