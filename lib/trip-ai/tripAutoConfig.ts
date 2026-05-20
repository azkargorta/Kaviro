import { readBoolean, readFiniteNumber, readRecord, readString } from "@/lib/parse-unknown";

export type TripAutoGeoStrictness = "auto" | "strict" | "balanced" | "loose";

export type TripAutoConfig = {
  pace: {
    itemsPerDayMin: number;
    itemsPerDayMax: number;
  };
  geo: {
    strictness: TripAutoGeoStrictness;
  };
  transport: {
    notes: string;
  };
  lodging: {
    mode: "proposal" | "manual" | "scan" | "omit";
    baseCityMode: "rotate" | "single";
    baseCity: string;
  };
  routes: {
    enabled: boolean;
  };
};

export const DEFAULT_TRIP_AUTO_CONFIG: TripAutoConfig = {
  pace: { itemsPerDayMin: 3, itemsPerDayMax: 5 },
  geo: { strictness: "auto" },
  transport: { notes: "" },
  lodging: { mode: "proposal", baseCityMode: "rotate", baseCity: "" },
  routes: { enabled: true },
};

export function normalizeTripAutoConfig(input: unknown): TripAutoConfig {
  const root = readRecord(input) ?? {};
  const pace = readRecord(root.pace) ?? {};
  const geo = readRecord(root.geo) ?? {};
  const transport = readRecord(root.transport) ?? {};
  const lodging = readRecord(root.lodging) ?? {};

  const strictnessRaw = readString(geo.strictness || root.geoStrictness);
  const strictness: TripAutoGeoStrictness =
    strictnessRaw === "auto" || strictnessRaw === "strict" || strictnessRaw === "loose" || strictnessRaw === "balanced"
      ? strictnessRaw
      : DEFAULT_TRIP_AUTO_CONFIG.geo.strictness;

  const min = readFiniteNumber(pace.itemsPerDayMin) ?? DEFAULT_TRIP_AUTO_CONFIG.pace.itemsPerDayMin;
  const max = readFiniteNumber(pace.itemsPerDayMax) ?? DEFAULT_TRIP_AUTO_CONFIG.pace.itemsPerDayMax;
  const itemsPerDayMin = Math.max(1, Math.min(12, Math.round(min)));
  const itemsPerDayMax = Math.max(itemsPerDayMin, Math.min(12, Math.round(max)));

  const lodgingModeRaw = readString(lodging.mode);
  const lodgingMode: TripAutoConfig["lodging"]["mode"] =
    lodgingModeRaw === "manual" || lodgingModeRaw === "scan" || lodgingModeRaw === "omit" || lodgingModeRaw === "proposal"
      ? lodgingModeRaw
      : DEFAULT_TRIP_AUTO_CONFIG.lodging.mode;

  const baseCityModeRaw = readString(lodging.baseCityMode || root.lodgingBaseCityMode);
  const baseCityMode: TripAutoConfig["lodging"]["baseCityMode"] =
    baseCityModeRaw === "single" || baseCityModeRaw === "rotate"
      ? baseCityModeRaw
      : DEFAULT_TRIP_AUTO_CONFIG.lodging.baseCityMode;
  const baseCity = readString(lodging.baseCity || root.lodgingBaseCity).trim();

  const routes = readRecord(root.routes);

  return {
    pace: { itemsPerDayMin, itemsPerDayMax },
    geo: { strictness },
    transport: { notes: readString(transport.notes) },
    lodging: { mode: lodgingMode, baseCityMode, baseCity },
    routes: { enabled: routes ? readBoolean(routes.enabled) : DEFAULT_TRIP_AUTO_CONFIG.routes.enabled },
  };
}
