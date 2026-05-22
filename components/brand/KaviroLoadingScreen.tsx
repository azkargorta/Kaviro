import Image from "next/image";
import { APP_NAME } from "@/lib/brand";
import { kaviroCoralImageFilter } from "@/lib/trip-tab-assets";

type Props = {
  /** Pantalla completa fija (navegación) o bloque dentro del layout de Next. */
  fixed?: boolean;
};

/**
 * Pantalla de carga de marca — fondo alineado con `--surface-page` para evitar flash blanco al cambiar de ruta.
 */
export default function KaviroLoadingScreen({ fixed = false }: Props) {
  const shell = fixed
    ? "fixed inset-0 z-[1200] flex flex-col items-center justify-center px-6 bg-[var(--surface-page)]"
    : "flex min-h-[100svh] flex-col items-center justify-center px-6 bg-[var(--surface-page)] text-[var(--text-primary)]";

  return (
    <div className={shell} role="status" aria-live="polite" aria-busy="true" aria-label="Cargando">
      <div className="flex flex-col items-center">
        <span className="inline-flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-raised)] ring-1 ring-[var(--border-default)] dark:bg-[#0F1623] dark:ring-[#1E293B]">
          <Image
            src="/brand/icon.png"
            alt=""
            width={72}
            height={72}
            priority
            className={`h-[72px] w-[72px] object-contain ${kaviroCoralImageFilter}`}
          />
        </span>
        <h1
          className="mt-6 text-3xl font-black tracking-tight"
          style={{
            backgroundImage: "linear-gradient(135deg, #F87171 0%, #EF4444 55%, #DC2626 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {APP_NAME}
        </h1>
        <p className="mt-2 max-w-xs text-center text-sm text-[var(--text-secondary)]">
          Preparando tu viaje, rutas, gastos y documentos…
        </p>
        <div className="mt-8 h-2 w-48 overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--brand)]" />
        </div>
      </div>
    </div>
  );
}
