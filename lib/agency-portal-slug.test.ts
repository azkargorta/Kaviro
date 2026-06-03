import { describe, expect, it } from "vitest";
import { agencyPortalSlugCandidate } from "@/lib/agency-portal-slug";

describe("agencyPortalSlugCandidate", () => {
  it("devuelve la base en el primer intento", () => {
    expect(agencyPortalSlugCandidate("nueva-york-2026", 1)).toBe("nueva-york-2026");
  });

  it("añade sufijo numérico en intentos siguientes", () => {
    expect(agencyPortalSlugCandidate("nueva-york-2026", 2)).toBe("nueva-york-2026-2");
    expect(agencyPortalSlugCandidate("nueva-york-2026", 3)).toBe("nueva-york-2026-3");
  });
});
