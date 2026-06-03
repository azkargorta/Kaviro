"use client";

import { createContext, useContext, type ReactNode } from "react";

const DashboardAnnouncementUnreadContext = createContext<Record<string, number>>({});

export function DashboardAnnouncementUnreadProvider({
  unreadByTripId,
  children,
}: {
  unreadByTripId: Record<string, number>;
  children: ReactNode;
}) {
  return (
    <DashboardAnnouncementUnreadContext.Provider value={unreadByTripId}>
      {children}
    </DashboardAnnouncementUnreadContext.Provider>
  );
}

export function useTripAnnouncementUnreadCount(tripId: string): number {
  const map = useContext(DashboardAnnouncementUnreadContext);
  return map[tripId] ?? 0;
}
