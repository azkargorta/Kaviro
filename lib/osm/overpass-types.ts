export type OverpassElement = {
  type?: string;
  id?: number | string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

export type OverpassJsonResponse = {
  elements?: OverpassElement[];
};

export function parseOverpassElements(payload: unknown): OverpassElement[] {
  if (!payload || typeof payload !== "object") return [];
  const elements = (payload as OverpassJsonResponse).elements;
  return Array.isArray(elements) ? elements : [];
}
