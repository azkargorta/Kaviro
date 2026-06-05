import { describe, expect, it } from "vitest";
import { diffNeedsMapPermission, diffOpName } from "@/lib/trip-ai/diff-types";

describe("diff-types", () => {
  it("diffOpName extrae el nombre de operación", () => {
    expect(diffOpName({ op: "create_route" })).toBe("create_route");
    expect(diffOpName(null)).toBe("");
    expect(diffOpName({})).toBe("");
  });

  it("diffNeedsMapPermission detecta rutas", () => {
    expect(diffNeedsMapPermission([{ op: "create_activity" }])).toBe(false);
    expect(diffNeedsMapPermission([{ op: "create_route" }])).toBe(true);
    expect(diffNeedsMapPermission([{ op: "update_route" }])).toBe(true);
  });
});
