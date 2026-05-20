import { describe, expect, it } from "vitest";
import {
  buildOnboardingSteps,
  isOnboardingComplete,
  isOnboardingStepDone,
  shouldShowTripOnboarding,
  type TripOnboardingCounts,
} from "@/lib/trip-onboarding";

const empty: TripOnboardingCounts = {
  participants: 1,
  activities: 0,
  routes: 0,
  expenses: 0,
  resources: 0,
  aiConversations: 0,
};

describe("trip onboarding", () => {
  it("marca pasos completados según conteos", () => {
    expect(isOnboardingStepDone("participants", { ...empty, participants: 2 })).toBe(true);
    expect(isOnboardingStepDone("plan", { ...empty, activities: 1 })).toBe(true);
    expect(isOnboardingStepDone("ai", { ...empty, aiConversations: 1 })).toBe(true);
  });

  it("detecta checklist completo", () => {
    const steps = buildOnboardingSteps("t1", false);
    const full: TripOnboardingCounts = {
      participants: 3,
      activities: 2,
      routes: 1,
      expenses: 1,
      resources: 1,
      aiConversations: 0,
    };
    expect(isOnboardingComplete(full, steps)).toBe(true);
  });

  it("shouldShow es false cuando todo está hecho (sin dismiss)", () => {
    const steps = buildOnboardingSteps("trip-x", false);
    const full: TripOnboardingCounts = {
      participants: 3,
      activities: 1,
      routes: 1,
      expenses: 1,
      resources: 1,
      aiConversations: 0,
    };
    expect(shouldShowTripOnboarding("trip-x", full, steps)).toBe(false);
  });
});
