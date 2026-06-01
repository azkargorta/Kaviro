import { describe, expect, it } from "vitest";
import {
  parseDelimitedTextToParticipants,
  parseParticipantListFromText,
  rowsToParticipantImports,
} from "@/lib/participants/parseParticipantList";

describe("parseParticipantList", () => {
  it("lee CSV con cabecera en español", () => {
    const csv = [
      "Nombre;Email;Teléfono",
      "Ana García;ana@ejemplo.com;+34600111222",
      "Luis Pérez;luis@ejemplo.com;600333444",
    ].join("\n");
    const rows = parseDelimitedTextToParticipants(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.display_name).toBe("Ana García");
    expect(rows[0]?.email).toBe("ana@ejemplo.com");
    expect(rows[1]?.phone).toBe("600333444");
  });

  it("deduplica por email en la misma importación", () => {
    const matrix = [
      ["Nombre", "Email", "Tel"],
      ["Ana", "ana@test.com", ""],
      ["Ana dup", "ana@test.com", ""],
    ];
    const rows = rowsToParticipantImports(matrix);
    expect(rows).toHaveLength(1);
  });
});
