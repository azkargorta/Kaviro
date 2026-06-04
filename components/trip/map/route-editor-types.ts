import type { TripRouteTravelMode } from "@/lib/route-travel-mode";

export type RouteEditorChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type RouteEditorFormState = {
  editingRouteId: string | null;
  routeDate: string;
  routeName: string;
  departureTime: string;
  color: string;
  autoColor: boolean;
  stopEnabled: boolean;
  noteText: string;
  checklist: RouteEditorChecklistItem[];
  restStopsEnabled: boolean;
  restStopsCount: number;
  restStopMinutes: number;
};

export type RouteEditorPlace = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type RouteEditorPlanOption = {
  id: string;
  title: string;
  hasCoords: boolean;
  activityDate: string | null;
};

export type RouteEditorPreview = {
  calculatedTravelMode: TripRouteTravelMode;
  durationAdjusted?: boolean;
  distanceText?: string | null;
  durationText?: string | null;
  arrivalTime?: string | null;
};

export type RouteEditorPlacePayload = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};
