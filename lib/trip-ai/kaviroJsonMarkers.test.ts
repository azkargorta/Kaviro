import { describe, expect, it } from "vitest";
import {
  extractJsonBetweenMarkers,
  KAVIRO_DIFF_JSON_END,
  KAVIRO_DIFF_JSON_START,
  TRIPBOARD_DIFF_JSON_END,
  TRIPBOARD_DIFF_JSON_START,
  DIFF_JSON_END_ALIASES,
  DIFF_JSON_START_ALIASES,
} from "@/lib/trip-ai/kaviroJsonMarkers";

describe("kaviroJsonMarkers", () => {
  it("extrae JSON con marcadores KAVIRO", () => {
    const raw = extractJsonBetweenMarkers(
      `texto ${KAVIRO_DIFF_JSON_START}{"version":1}${KAVIRO_DIFF_JSON_END} fin`,
      DIFF_JSON_START_ALIASES,
      DIFF_JSON_END_ALIASES
    );
    expect(raw).toBe('{"version":1}');
  });

  it("acepta alias legado TRIPBOARD al extraer", () => {
    const raw = extractJsonBetweenMarkers(
      `${TRIPBOARD_DIFF_JSON_START}{"version":1}${TRIPBOARD_DIFF_JSON_END}`,
      DIFF_JSON_START_ALIASES,
      DIFF_JSON_END_ALIASES
    );
    expect(raw).toBe('{"version":1}');
  });
});
