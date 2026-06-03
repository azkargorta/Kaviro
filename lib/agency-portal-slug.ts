import type { SupabaseClient } from "@supabase/supabase-js";
import { slugifyForUrl } from "@/lib/agency-slug";

const MAX_SLUG_LEN = 64;

/** Variante numerada para evitar colisión en `trips_agency_client_slug_uidx`. */
export function agencyPortalSlugCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  const maxBase = Math.max(8, MAX_SLUG_LEN - suffix.length);
  return `${base.slice(0, maxBase)}${suffix}`;
}

export function isAgencyPortalSlugConflict(message: string): boolean {
  return /trips_agency_client_slug_uidx/i.test(message);
}

export function friendlyAgencyPortalSlugError(message: string): string {
  if (isAgencyPortalSlugConflict(message)) {
    return "Ya existe un viaje con ese enlace de portal para esta agencia. Usa otro nombre o un slug distinto.";
  }
  return message;
}

/**
 * Slug único por agencia para `trips.client_portal_slug`.
 * Si `preferred` ya existe, prueba `base-2`, `base-3`, …
 */
export async function resolveUniqueAgencyClientPortalSlug(
  supabase: SupabaseClient,
  agencyId: string,
  preferred: string
): Promise<string> {
  const base = slugifyForUrl(preferred);
  for (let attempt = 1; attempt < 120; attempt++) {
    const candidate = agencyPortalSlugCandidate(base, attempt);
    const { data } = await supabase
      .from("trips")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("client_portal_slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data) return candidate;
  }
  return agencyPortalSlugCandidate(base, Date.now() % 100000);
}
