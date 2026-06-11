import type { ReactNode } from "react";
import { TRIP_PANEL } from "@/components/trip/ui/trip-ui-classes";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
  as?: "div" | "section" | "article";
};

const PADDING = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
};

export default function TripPanel({ children, className = "", padding = "md", as: Tag = "div" }: Props) {
  return <Tag className={`${TRIP_PANEL} ${PADDING[padding]} ${className}`}>{children}</Tag>;
}
