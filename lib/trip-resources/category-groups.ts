export type ResourceGroupKey = "flights" | "lodging" | "transport" | "insurance" | "other";

export const RESOURCE_GROUP_META: Record<
  ResourceGroupKey,
  { label: string; icon: string; order: number }
> = {
  flights: { label: "Vuelos", icon: "✈️", order: 1 },
  lodging: { label: "Alojamiento", icon: "🏨", order: 2 },
  transport: { label: "Transporte", icon: "🚂", order: 3 },
  insurance: { label: "Seguros", icon: "🛡️", order: 4 },
  other: { label: "Otros", icon: "📎", order: 5 },
};

type ResourceLike = {
  category?: string | null;
  resource_type?: string | null;
  title?: string | null;
  mime_type?: string | null;
};

export function resolveResourceGroup(resource: ResourceLike): ResourceGroupKey {
  const cat = String(resource.category || "").toLowerCase();
  const type = String(resource.resource_type || "").toLowerCase();
  const title = String(resource.title || "").toLowerCase();

  if (cat === "insurance" || title.includes("seguro")) return "insurance";
  if (
    cat === "ticket" ||
    type.includes("flight") ||
    title.includes("vuelo") ||
    title.includes("boarding") ||
    title.includes("avión") ||
    title.includes("avion")
  ) {
    return "flights";
  }
  if (
    cat === "reservation" ||
    title.includes("hotel") ||
    title.includes("aloj") ||
    title.includes("hostel") ||
    title.includes("airbnb")
  ) {
    return "lodging";
  }
  if (
    title.includes("tren") ||
    title.includes("train") ||
    title.includes("bus") ||
    title.includes("ferry") ||
    title.includes("metro") ||
    title.includes("traslado")
  ) {
    return "transport";
  }
  return "other";
}

export function resolveReservationGroup(reservationType: string | null | undefined): ResourceGroupKey {
  const t = String(reservationType || "").toLowerCase();
  if (t.includes("flight") || t.includes("vuelo") || t.includes("avion")) return "flights";
  if (t.includes("hotel") || t.includes("lodging") || t.includes("alojamiento")) return "lodging";
  if (t.includes("train") || t.includes("tren") || t.includes("bus") || t.includes("transport"))
    return "transport";
  if (t.includes("insurance") || t.includes("seguro")) return "insurance";
  return "other";
}

export function groupByResourceCategory<T>(
  items: T[],
  resolve: (item: T) => ResourceGroupKey
): Array<{ key: ResourceGroupKey; label: string; icon: string; items: T[] }> {
  const map = new Map<ResourceGroupKey, T[]>();
  for (const item of items) {
    const key = resolve(item);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([key, groupItems]) => ({
      key,
      label: RESOURCE_GROUP_META[key].label,
      icon: RESOURCE_GROUP_META[key].icon,
      items: groupItems,
    }))
    .sort((a, b) => RESOURCE_GROUP_META[a.key].order - RESOURCE_GROUP_META[b.key].order);
}
