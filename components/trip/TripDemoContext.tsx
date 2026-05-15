"use client";

import { createContext, useContext, type ReactNode } from "react";

const TripDemoContext = createContext(false);

export function TripDemoProvider({ isDemo, children }: { isDemo: boolean; children: ReactNode }) {
  return <TripDemoContext.Provider value={isDemo}>{children}</TripDemoContext.Provider>;
}

export function useIsDemoTrip() {
  return useContext(TripDemoContext);
}
