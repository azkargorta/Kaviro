import type { TripTabKey } from "@/lib/trip-tab-assets";

export const TRIP_NAV_GROUPS: { label: string; keys: TripTabKey[] }[] = [
  { label: "Viaje", keys: ["summary", "plan", "map", "today"] },
  { label: "Organización", keys: ["expenses", "participants", "resources"] },
  {
    label: "Más",
    keys: ["chat", "recap", "announcements", "messages", "payments", "settings"],
  },
];

export function isTripNavActivePath(pathname: string, href: string, key: string) {
  if (pathname === href) return true;
  if (key === "map" && pathname.startsWith(`${href}/`)) return true;
  if (key === "settings" && pathname.startsWith(href)) return true;
  if (key === "announcements" && pathname.startsWith(href)) return true;
  if (key === "messages" && pathname.startsWith(href)) return true;
  if (key === "payments" && pathname.startsWith(href)) return true;
  return false;
}
