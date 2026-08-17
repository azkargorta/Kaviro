export type LatLng = { lat: number; lng: number };
export type GeoStop = { label: string; center: LatLng };
export type StayBlock = { stop: string; nights: number; reason: string };

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  return (
    R *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(dLat / 2) ** 2 +
          Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      )
    )
  );
}

function bearingDeg(from: LatLng, to: LatLng): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

function angleDelta(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

export function matchStopByHint(stops: GeoStop[], hint: string | null | undefined): GeoStop | null {
  const n = norm(hint || "");
  if (!n || !stops.length) return null;
  let best: GeoStop | null = null;
  let bestScore = 0;
  for (const s of stops) {
    const l = norm(s.label);
    if (!l) continue;
    let score = 0;
    if (n === l) score = 100;
    else if (n.includes(l)) score = 80 + l.length;
    else if (l.includes(n)) score = 60 + n.length;
    else {
      const tokens = l.split(" ").filter((t) => t.length >= 4);
      if (tokens.some((t) => n.includes(t))) score = 50 + l.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 50 ? best : null;
}

function sameStop(a: GeoStop, b: GeoStop): boolean {
  return norm(a.label) === norm(b.label);
}

function collapseConsecutive(route: GeoStop[]): GeoStop[] {
  const out: GeoStop[] = [];
  for (const s of route) {
    const last = out[out.length - 1];
    if (last && sameStop(last, s)) continue;
    out.push(s);
  }
  return out;
}

function nearestNeighbor(stops: GeoStop[], from: LatLng): GeoStop[] {
  const left = [...stops];
  const out: GeoStop[] = [];
  let cur = from;
  while (left.length) {
    left.sort((a, b) => haversineKm(cur, a.center) - haversineKm(cur, b.center));
    const next = left.shift()!;
    out.push(next);
    cur = next.center;
  }
  return out;
}

function othersAreOppositeSpokes(hub: GeoStop, others: GeoStop[]): boolean {
  if (others.length < 2) return false;
  let maxAngle = 0;
  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      const ang = angleDelta(bearingDeg(hub.center, others[i]!.center), bearingDeg(hub.center, others[j]!.center));
      if (ang > maxAngle) maxAngle = ang;
    }
  }
  return maxAngle >= 90;
}

/**
 * Orden de noches para minimizar km extra.
 * Si llegada y salida caen en la misma base y el resto está en direcciones opuestas
 * (p. ej. Salta + Cafayate sur + Tilcara norte), vuelve al hub entre radios.
 */
export function buildStayRoute(
  stops: GeoStop[],
  opts?: { startHint?: string | null; endHint?: string | null }
): GeoStop[] {
  if (stops.length <= 1) return stops.slice();
  const start = matchStopByHint(stops, opts?.startHint) || stops[0]!;
  const end = matchStopByHint(stops, opts?.endHint) || start;

  if (sameStop(start, end)) {
    const hub = start;
    const others = stops.filter((s) => !sameStop(s, hub));
    if (!others.length) return [hub];
    if (others.length === 1) return collapseConsecutive([hub, others[0]!, hub]);

    if (othersAreOppositeSpokes(hub, others)) {
      const ranked = [...others].sort((a, b) => haversineKm(hub.center, a.center) - haversineKm(hub.center, b.center));
      const seq: GeoStop[] = [hub];
      for (let i = 0; i < ranked.length; i++) {
        seq.push(ranked[i]!);
        if (i < ranked.length - 1) seq.push(hub);
      }
      seq.push(hub);
      return collapseConsecutive(seq);
    }

    return collapseConsecutive([hub, ...nearestNeighbor(others, hub.center), hub]);
  }

  const middle = stops.filter((s) => !sameStop(s, start) && !sameStop(s, end));
  return collapseConsecutive([start, ...nearestNeighbor(middle, start.center), end]);
}

function dropOptionalMiddleHubs(labels: string[], totalDays: number): string[] {
  const seq = [...labels];
  const hub = seq[0];
  while (seq.length > totalDays) {
    let dropped = false;
    for (let i = 1; i < seq.length - 1; i++) {
      if (seq[i] === hub) {
        seq.splice(i, 1);
        dropped = true;
        break;
      }
    }
    if (!dropped) break;
  }
  return seq;
}

export function allocateNightsOnRoute(route: GeoStop[], totalDays: number): StayBlock[] {
  const days = Math.max(1, Math.round(totalDays));
  if (!route.length) return [];
  if (route.length === 1) {
    return [{ stop: route[0]!.label, nights: days, reason: `${days} días para explorar a fondo` }];
  }

  let seq = dropOptionalMiddleHubs(
    route.map((s) => s.label),
    days
  );
  if (!seq.length) seq = [route[0]!.label];
  while (seq.length > days && seq.length > 1) seq.splice(Math.floor(seq.length / 2), 1);

  const nights = seq.map(() => 1);
  let leftover = days - seq.length;
  const hub = seq[0];
  const spokeIdx = seq.map((s, i) => i).filter((i) => seq[i] !== hub);
  const fillOrder = spokeIdx.length ? spokeIdx.slice().reverse() : seq.map((_, i) => i);
  let k = 0;
  while (leftover > 0 && fillOrder.length) {
    nights[fillOrder[k % fillOrder.length]!]! += 1;
    leftover--;
    k++;
  }

  const blocks: StayBlock[] = [];
  for (let i = 0; i < seq.length; i++) {
    const stop = seq[i]!;
    const n = nights[i]!;
    const last = blocks[blocks.length - 1];
    if (last && last.stop === stop) {
      last.nights += n;
      continue;
    }
    const isHub = stop === hub;
    const isFirst = i === 0;
    const isLast = i === seq.length - 1;
    const reason = isHub && isFirst
      ? `${n} día${n !== 1 ? "s" : ""} — llegada, sin trayectos de más`
      : isHub && isLast
        ? `${n} día${n !== 1 ? "s" : ""} — vuelta para la salida`
        : isHub
          ? `${n} día${n !== 1 ? "s" : ""} — puente entre zonas (evita cruzar el mapa)`
          : `${n} día${n !== 1 ? "s" : ""} — zona para visitar sin desandar camino`;
    blocks.push({ stop, nights: n, reason });
  }
  return blocks;
}

export function planStaysToMinimizeDriving(
  stops: GeoStop[],
  totalDays: number,
  opts?: { startHint?: string | null; endHint?: string | null }
): StayBlock[] {
  const route = buildStayRoute(stops, opts);
  return allocateNightsOnRoute(route, totalDays);
}
