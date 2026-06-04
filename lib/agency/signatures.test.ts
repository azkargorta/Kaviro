import { describe, expect, it } from "vitest";
import { validateSignatureDataUrl, signatureProgress } from "@/lib/agency/signatures";

describe("validateSignatureDataUrl", () => {
  it("rejects non-png", () => {
    expect(validateSignatureDataUrl("data:image/jpeg;base64,abc")).toMatch(/PNG/);
  });

  it("accepts png prefix", () => {
    expect(validateSignatureDataUrl("data:image/png;base64,abc")).toBeNull();
  });
});

describe("signatureProgress", () => {
  it("counts signed", () => {
    expect(
      signatureProgress([{ signed_at: "2026-01-01" }, { signed_at: null }])
    ).toEqual({ signed: 1, total: 2, pending: 1 });
  });
});
