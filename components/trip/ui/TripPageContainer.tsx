import type { ReactNode } from "react";
import { TRIP_PAGE_STACK } from "@/components/trip/ui/trip-ui-classes";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "main";
};

export default function TripPageContainer({ children, className = "", as: Tag = "div" }: Props) {
  return <Tag className={`${TRIP_PAGE_STACK} ${className}`}>{children}</Tag>;
}
