import type { TripRouteTravelMode } from "@/lib/route-travel-mode";
import type { RoutePathPoint } from "@/lib/trip-ai/route-points";

export type RoutesDraftRoute = {
  title: string;
  route_day: string;
  departure_time: string | null;
  travel_mode: TripRouteTravelMode;
  origin_name: string;
  origin_address: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;
  destination_name: string;
  destination_address: string | null;
  destination_latitude: number | null;
  destination_longitude: number | null;
  path_points: RoutePathPoint[];
  route_points: RoutePathPoint[];
  distance_text: string | null;
  duration_text: string | null;
  notes: string | null;
  color?: string | null;
};

export type RoutesDraftPayload = {
  version: 1;
  date: string;
  travelMode: TripRouteTravelMode;
  routes: RoutesDraftRoute[];
};
