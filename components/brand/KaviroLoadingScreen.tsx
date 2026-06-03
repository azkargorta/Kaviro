import { APP_NAME } from "@/lib/brand";
import KaviroMark from "@/components/brand/KaviroMark";
import { AGENCY_NAVY, AGENCY_NAVY_DARK } from "@/lib/agency-theme";

type Props = {
  /** Pantalla completa fija (navegación) o bloque dentro del layout de Next. */
  fixed?: boolean;
  /** Texto bajo el logo (p. ej. bienvenida tras login). */
  subtitle?: string;
  /** `navy` en flujos Kaviro Trips; `coral` en Kaviro personal (por defecto). */
  brand?: "coral" | "navy";
};

/**
 * Pantalla de carga de marca — fondo alineado con `--surface-page` para evitar flash blanco al cambiar de ruta.
 */
export default function KaviroLoadingScreen({ fixed = false, subtitle, brand = "coral" }: Props) {
  const isNavy = brand === "navy";
  const shell = fixed
    ? "fixed inset-0 z-[1200] flex flex-col items-center justify-center px-6 bg-[var(--surface-page)]"
    : "flex min-h-[100svh] flex-col items-center justify-center px-6 bg-[var(--surface-page)] text-[var(--text-primary)]";

  const titleGradient = isNavy
    ? `linear-gradient(135deg, ${AGENCY_NAVY} 0%, ${AGENCY_NAVY_DARK} 55%, #0f172a 100%)`
    : "linear-gradient(135deg, #F87171 0%, #EF4444 55%, #DC2626 100%)";

  return (
    <div className={shell} role="status" aria-live="polite" aria-busy="true" aria-label="Cargando">
      <div className="flex flex-col items-center">
        <KaviroMark
          variant={isNavy ? "navy" : "coral"}
          size={96}
          className={`overflow-hidden rounded-[28px] shadow-[var(--shadow-raised)] ${
            isNavy ? "ring-1 ring-[#1e3a5f]/30 rounded-full" : "ring-1 ring-[#F87171]/25 rounded-full"
          }`}
        />
        <h1
          className="mt-6 text-3xl font-black tracking-tight"
          style={{
            backgroundImage: titleGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {APP_NAME}
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm font-semibold text-[var(--text-secondary)]">
          {subtitle ??
            (isNavy
              ? "Preparando tu panel y programas…"
              : "Preparando tu viaje, rutas, gastos y documentos…")}
        </p>
        <div className="mt-8 h-2 w-48 overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--brand)]" />
        </div>
      </div>
    </div>
  );
}
