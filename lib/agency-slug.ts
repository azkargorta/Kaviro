/** Slug URL-safe para agencia o portal cliente. */
export function slugifyForUrl(value: string, maxLen = 64): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return base || "viaje";
}
