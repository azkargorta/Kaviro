import { describe, expect, it } from "vitest";
import { extractScheduleSlotFromLine, parseHourMinuteToken } from "@/lib/trip-ai/parseScheduleSlots";

describe("parseHourMinuteToken", () => {
  it("corrige OCR O→0 en horas", () => {
    expect(parseHourMinuteToken("O8", "30")).toBe("08:30");
    expect(parseHourMinuteToken("16", "OO")).toBe("16:00");
  });
});

describe("extractScheduleSlotFromLine", () => {
  it("lee viñetas con hora al inicio", () => {
    expect(extractScheduleSlotFromLine("- 07.30h Desayuno en Hotel NH")?.time).toBe("07:30");
  });

  it("lee hora en medio de línea (OCR)", () => {
    const slot = extractScheduleSlotFromLine("Excursión glaciar  14.00h  Perito Moreno");
    expect(slot?.time).toBe("14:00");
    expect(slot?.label).toMatch(/excursi/i);
  });

  it("lee hora al final de la línea", () => {
    const slot = extractScheduleSlotFromLine("Tarde libre 17.30h");
    expect(slot?.time).toBe("17:30");
  });
});
