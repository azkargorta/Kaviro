import Link from "next/link";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyTemplatesPage() {
  await requireAgencyContext("/agency/templates");

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">Plantillas</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Reutiliza itinerarios entre clientes (Bloque 3). Mientras tanto, duplica un viaje desde el panel y asígnalo
        como plantilla en Supabase.
      </p>
      <Link
        href="/agency"
        className="inline-flex text-sm font-bold text-[#1e3a5f] hover:underline dark:text-sky-300"
      >
        ← Volver a mis viajes
      </Link>
    </div>
  );
}
