"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugifyForUrl } from "@/lib/agency-slug";
import { agencyBtnPrimaryClass, agencyCardClass } from "@/lib/agency-theme";
import { Loader2 } from "lucide-react";

type Props = {
  defaultEmail?: string | null;
};

export default function AgencySetupForm({ defaultEmail }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [contactEmail, setContactEmail] = useState(defaultEmail || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugPreview = useMemo(() => {
    const raw = slugTouched ? slug : slugifyForUrl(name);
    return raw || "tu-agencia";
  }, [name, slug, slugTouched]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agencies/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slugTouched ? slug : undefined,
          contactEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo crear la agencia.");
        return;
      }
      router.replace("/agency?welcome=1");
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${agencyCardClass} mx-auto w-full max-w-lg p-6`}>
      <label className="block text-sm font-semibold text-slate-900 dark:text-white">
        Nombre de la agencia
        <input
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
          placeholder="Stripes Viajes"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-slate-900 dark:text-white">
        Identificador URL
        <input
          maxLength={64}
          value={slugTouched ? slug : slugPreview}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-[#334155] dark:bg-[#0B1220]"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Portal cliente: kaviro.app/client/{slugPreview}/…
        </span>
      </label>

      <label className="mt-4 block text-sm font-semibold text-slate-900 dark:text-white">
        Email de contacto
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
        />
      </label>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Incluye <strong>14 días de prueba</strong> con hasta 2 miembros del equipo. Después puedes pasar a Agency
        Pro o contactarnos para un plan partnership.
      </p>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

      <button type="submit" disabled={busy} className={`${agencyBtnPrimaryClass} mt-5 w-full gap-2`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Crear mi agencia
      </button>
    </form>
  );
}
