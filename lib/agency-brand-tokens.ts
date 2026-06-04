import type { CSSProperties } from "react";
import { AGENCY_NAVY_DARK } from "@/lib/agency-theme";

function normalizeHex(hex: string): string | null {
  const h = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    const r = h[1]!;
    const g = h[2]!;
    const b = h[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

function darkenHex(hex: string, factor = 0.18): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mix = (c: number) => Math.max(0, Math.round(c * (1 - factor)));
  const r = mix(rgb.r).toString(16).padStart(2, "0");
  const g = mix(rgb.g).toString(16).padStart(2, "0");
  const b = mix(rgb.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/** Variables CSS --brand* para el workspace del viajero (viaje de agencia). */
export function agencyBrandingStyleVars(brandColor: string): CSSProperties {
  const brand = normalizeHex(brandColor) || "#1e3a5f";
  const hover = darkenHex(brand, 0.14);
  const rgb = hexToRgb(brand)!;

  return {
    "--brand": brand,
    "--brand-hover": hover,
    "--brand-light": `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`,
    "--brand-border": `rgba(${rgb.r},${rgb.g},${rgb.b},0.28)`,
    "--brand-text": hover,
    "--accent": brand,
    "--accent-hover": hover,
    "--accent-light": `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`,
  } as CSSProperties;
}

/** Cabecera del viaje / portal con color de marca de la agencia. */
export function agencyBrandedHeroGradient(brandColor: string): string {
  const brand = normalizeHex(brandColor) || "#1e3a5f";
  const dark = darkenHex(brand, 0.38);
  return `linear-gradient(90deg, ${brand} 0%, ${dark} 55%, ${AGENCY_NAVY_DARK} 100%)`;
}

export function agencyBrandedHeroGradientDiagonal(brandColor: string): string {
  const brand = normalizeHex(brandColor) || "#1e3a5f";
  const dark = darkenHex(brand, 0.32);
  return `linear-gradient(135deg, ${brand} 0%, ${dark} 55%, ${AGENCY_NAVY_DARK} 100%)`;
}
