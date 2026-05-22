import type { TripActivity } from "@/hooks/useTripActivities";
import type { TripList, TripListItem } from "@/hooks/useTripLists";
import type { TripReservation, TripResource } from "@/hooks/useTripResources";

export type OfflineTripMeta = {
  id: string;
  name: string;
  destination: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type OfflineTripIndexEntry = OfflineTripMeta & {
  syncedAt: string;
};

export type OfflineTripIndex = {
  updatedAt: string;
  trips: OfflineTripIndexEntry[];
};

export type TripOfflineBundle = {
  version: 1;
  tripId: string;
  syncedAt: string;
  trip: OfflineTripMeta | null;
  activities: TripActivity[];
  lists: TripList[];
  countsByList: Record<string, { total: number; done: number }>;
  listItemsByListId: Record<string, TripListItem[]>;
  reservations: TripReservation[];
  resources: TripResource[];
};
