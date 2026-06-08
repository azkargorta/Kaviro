/** Mapa participante → importe (EUR u otra moneda del gasto). */
export type AmountsMap = Record<string, number>;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function parseAmountsMap(raw: unknown): AmountsMap | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: AmountsMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const name = key.trim();
    if (!name) continue;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < 0) continue;
    out[name] = round2(n);
  }
  return Object.keys(out).length ? out : null;
}

/** Reparto por persona: usa mapa custom si cubre todos los nombres; si no, partes iguales. */
export function resolvePersonShares(
  names: string[],
  total: number,
  custom: AmountsMap | null | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  if (!names.length || total <= 0) return map;

  if (custom) {
    let covered = true;
    let sum = 0;
    for (const name of names) {
      const v = custom[name];
      if (v == null || !Number.isFinite(v)) {
        covered = false;
        break;
      }
      sum += v;
      map.set(name, round2(v));
    }
    if (covered && map.size === names.length) {
      return map;
    }
    map.clear();
  }

  const each = round2(total / names.length);
  let assigned = 0;
  for (let i = 0; i < names.length; i++) {
    const name = names[i]!;
    const share = i === names.length - 1 ? round2(total - assigned) : each;
    map.set(name, share);
    assigned += share;
  }
  return map;
}

export function validateCustomShares(
  names: string[],
  amounts: AmountsMap,
  total: number,
  tolerance = 0.02
): { ok: true } | { ok: false; sum: number } {
  let sum = 0;
  for (const name of names) {
    const v = amounts[name];
    if (v == null || !Number.isFinite(v) || v < 0) {
      return { ok: false, sum: 0 };
    }
    sum += v;
  }
  sum = round2(sum);
  if (Math.abs(sum - round2(total)) > tolerance) {
    return { ok: false, sum };
  }
  return { ok: true };
}

export function equalSharePreview(total: number, count: number) {
  if (count <= 0 || total <= 0) return 0;
  return round2(total / count);
}
