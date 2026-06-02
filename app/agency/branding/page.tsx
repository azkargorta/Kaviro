import { agencyBrandingFromRow } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";

export default async function AgencyBrandingPage() {
  const { agency } = await requireAgencyContext("/agency/branding");
  const branding = agencyBrandingFromRow(agency);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">Branding</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Logo y color para el portal cliente. El formulario de subida llega en el Bloque 5.
      </p>
      <div
        className="rounded-2xl border border-slate-200 p-4 dark:border-[#1E293B]"
        style={{ borderTopWidth: 4, borderTopColor: branding.brandColor }}
      >
        <p className="text-xs font-bold uppercase text-slate-500">Vista previa cabecera</p>
        <p className="mt-2 text-lg font-extrabold">{branding.name}</p>
        <p className="mt-1 text-sm text-slate-600">Color: {branding.brandColor}</p>
        {branding.contactEmail ? (
          <p className="mt-1 text-sm text-slate-600">Contacto: {branding.contactEmail}</p>
        ) : null}
      </div>
    </div>
  );
}
