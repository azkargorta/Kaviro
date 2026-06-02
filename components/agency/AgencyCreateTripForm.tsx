"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { clientPortalPath } from "@/lib/agency";
import { slugifyForUrl } from "@/lib/agency-slug";
import {
  agencyBtnPrimaryClass,
  agencyCardClass,
  agencyInputClass,
  agencyLabelClass,
} from "@/lib/agency-theme";
import { useSyncedTripDates } from "@/lib/use-synced-trip-dates";

type Props = {
  agencySlug: string;
  onCreated?: () => void;
};

export default function AgencyCreateTripForm({ agencySlug, onCreated }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [portalSlug, setPortalSlug] = useState("");
  const [portalTouched, setPortalTouched] = useState(false);
  const { startDate, endDate, setStartDate, setEndDate, endDateMin, validateDates } =
    useSyncedTripDates();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [agencyClientId, setAgencyClientId] = useState("");

  useEffect(() => {
    fetch("/api/agencies/clients", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.clients)) {
          setClients(data.clients.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  const effectiveSlug = useMemo(() => {
    const raw = portalTouched ? portalSlug : portalSlug || name;
    return slugifyForUrl(raw.trim() || name.trim() || "viaje");
  }, [portalSlug, portalTouched, name]);

  const portalPreview =
    name.trim() && effectiveSlug
      ? clientPortalPath(agencySlug, effectiveSlug)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre del grupo o cliente es obligatorio.");
      return;
    }

    const dateErr = validateDates();
    if (dateErr) {
      setError(dateErr);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agencies/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          destination: destination.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          client_portal_slug: effectiveSlug,
          base_currency: "EUR",
          ...(agencyClientId ? { agency_client_id: agencyClientId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el viaje.");

      toast.push({
        kind: "success",
        title: "Viaje creado",
        description: "Puedes completar el itinerario en el plan.",
      });
      onCreated?.();
      router.push(`/trip/${data.tripId}/plan`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${agencyCardClass} p-5 sm:p-6`}>
      <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nuevo viaje de cliente</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Datos del grupo y fechas del programa. El portal público se genera automáticamente.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {clients.length > 0 ? (
          <label className={agencyLabelClass}>
            Cliente (opcional)
            <select
              value={agencyClientId}
              onChange={(e) => {
                const id = e.target.value;
                setAgencyClientId(id);
                const picked = clients.find((c) => c.id === id);
                if (picked && !name.trim()) setName(picked.name);
              }}
              className={agencyInputClass}
            >
              <option value="">— Sin vincular —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className={agencyLabelClass}>
          Nombre del grupo / programa
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={agencyInputClass}
            placeholder="Chicago NFL 2026 — Grupo A"
            required
          />
        </label>

        <label className={agencyLabelClass}>
          Destino principal
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={agencyInputClass}
            placeholder="Chicago, Estados Unidos"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={agencyLabelClass}>
            Fecha de inicio
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={agencyInputClass}
            />
          </label>
          <label className={agencyLabelClass}>
            Fecha de fin
            <input
              type="date"
              value={endDate}
              min={endDateMin}
              disabled={!startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={agencyInputClass}
            />
          </label>
        </div>
        {!startDate ? (
          <p className="-mt-2 text-xs text-slate-500">Indica la fecha de inicio para elegir la de fin.</p>
        ) : null}

        <label className={agencyLabelClass}>
          Identificador del portal (URL)
          <input
            value={portalTouched ? portalSlug : portalSlug || slugifyForUrl(name)}
            onChange={(e) => {
              setPortalTouched(true);
              setPortalSlug(e.target.value);
            }}
            onBlur={() => {
              if (!portalTouched && name.trim()) {
                setPortalSlug(slugifyForUrl(name));
              }
            }}
            className={agencyInputClass}
            placeholder="chicago-nfl-2026"
          />
          {portalPreview ? (
            <p className="mt-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">{portalPreview}</p>
          ) : null}
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        <button type="submit" disabled={loading} className={`${agencyBtnPrimaryClass} min-w-[10rem]`}>
          {loading ? "Creando…" : "Crear y abrir plan"}
        </button>
        <p className="text-xs text-slate-500 dark:text-slate-400 self-center">
          Sin pasos de onboarding ni moneda: enfoque operativo para tu equipo.
        </p>
      </div>
    </form>
  );
}
