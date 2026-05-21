import { describe, expect, it } from "vitest";
import {
  SEARCH_JSON_END,
  SEARCH_JSON_START,
  enrichTravelSearchOffers,
  parseTravelSearchOffersFromAnswer,
} from "./travelSearchOffers";

describe("travelSearchOffers", () => {
  it("parsea JSON entre marcadores", () => {
    const answer = `Texto breve.
${SEARCH_JSON_START}
{"version":1,"category":"vuelo","title":"Vuelos a París","intro":null,"tripLine":"Madrid → París","searchParams":{"origin":"Madrid","destination":"París","startDate":"2026-06-01","endDate":"2026-06-08","adults":2,"tripType":"ida-vuelta"},"options":[{"name":"Iberia","description":"Directo","priceHint":"desde 120€","priceNote":"estimado","bookingUrl":null}],"tip":"Reserva con antelación"}
${SEARCH_JSON_END}`;
    const parsed = parseTravelSearchOffersFromAnswer(answer);
    expect(parsed?.category).toBe("vuelo");
    expect(parsed?.options).toHaveLength(1);
    expect(parsed?.options[0]?.name).toBe("Iberia");
  });

  it("enriquece con plataformas de vuelo", () => {
    const payload = parseTravelSearchOffersFromAnswer(
      `${SEARCH_JSON_START}{"version":1,"category":"vuelo","title":"T","searchParams":{"origin":"Madrid","destination":"Barcelona","startDate":"2026-07-01","endDate":"2026-07-05","adults":2},"options":[{"name":"A","priceHint":"50€"}]}${SEARCH_JSON_END}`
    )!;
    const enriched = enrichTravelSearchOffers(payload);
    expect(enriched.platforms.length).toBeGreaterThan(0);
    expect(enriched.platforms.some((p) => p.url.includes("http"))).toBe(true);
  });
});
