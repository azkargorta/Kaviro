import { describe, expect, it } from "vitest";
import { extractItineraryFromAnswer } from "@/lib/trip-ai/extractItineraryFromAnswer";
import {
  TRIPBOARD_ITINERARY_JSON_END,
  TRIPBOARD_ITINERARY_JSON_START,
} from "@/lib/trip-ai/tripboardJsonMarkers";

describe("extractItineraryFromAnswer", () => {
  it("lee marcadores TRIPBOARD", () => {
    const answer = [
      "Listo.",
      TRIPBOARD_ITINERARY_JSON_START,
      JSON.stringify({
        version: 1,
        days: [{ day: 1, date: "2026-10-28", items: [{ title: "Vuelo", start_time: "12:00" }] }],
      }),
      TRIPBOARD_ITINERARY_JSON_END,
    ].join("\n");
    const out = extractItineraryFromAnswer(answer);
    expect(out?.days[0].items[0].title).toBe("Vuelo");
  });

  it("acepta alias legado KAVIRO_ITINERARY", () => {
    const answer = [
      "KAVIRO_ITINERARY_JSON_START",
      JSON.stringify({
        version: 1,
        days: [{ day: 1, date: null, items: [{ title: "Bean" }] }],
      }),
      "KAVIRO_ITINERARY_JSON_END",
    ].join("\n");
    expect(extractItineraryFromAnswer(answer)?.days[0].items[0].title).toBe("Bean");
  });

  it("lee bloque ```json", () => {
    const answer = [
      "Aquí va:",
      "```json",
      JSON.stringify({
        version: 1,
        days: [{ day: 1, date: null, items: [{ title: "Hotel", requires_ticket: false }] }],
      }),
      "```",
    ].join("\n");
    const out = extractItineraryFromAnswer(answer);
    expect(out?.days[0].items[0].title).toBe("Hotel");
  });
});
