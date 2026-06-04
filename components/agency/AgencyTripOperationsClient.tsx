"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ClipboardList, CreditCard, FileSignature, FileText, Loader2, Mail, Star, UserPlus, Users } from "lucide-react";
import AgencyTripSignaturesSection from "@/components/agency/AgencyTripSignaturesSection";
import AgencyTripPretravelSection from "@/components/agency/AgencyTripPretravelSection";
import AgencyTripQuotesSection from "@/components/agency/AgencyTripQuotesSection";
import AgencyTripPaymentsSection from "@/components/agency/AgencyTripPaymentsSection";
import AgencyTripEmailsSection from "@/components/agency/AgencyTripEmailsSection";
import AgencyTripNpsSection from "@/components/agency/AgencyTripNpsSection";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
  agencyInputClass,
  agencyLabelClass,
  agencyPageSubtitleClass,
} from "@/lib/agency-theme";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/agency/booking-status";
import { useToast } from "@/components/ui/toast";

type CapacitySummary = {
  maxCapacity: number | null;
  waitlistEnabled: boolean;
  counts: {
    occupied: number;
    interested: number;
    waitlist: number;
    cancelled: number;
    available: number | null;
    isFull: boolean;
  };
};

type Traveler = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  booking_status: string | null;
};

type ChecklistItem = {
  id: string;
  label: string;
  is_checked: boolean;
};

export default function AgencyTripOperationsClient({
  tripId,
  tripName,
}: {
  tripId: string;
  tripName: string;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<CapacitySummary | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checkProgress, setCheckProgress] = useState({ done: 0, total: 0 });
  const [maxInput, setMaxInput] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [capRes, rosterRes, clRes] = await Promise.all([
        fetch(`/api/agencies/trips/${tripId}/capacity`, { cache: "no-store" }),
        fetch(`/api/agencies/trips/${tripId}/roster`, { cache: "no-store" }),
        fetch(`/api/agencies/trips/${tripId}/checklist`, { cache: "no-store" }),
      ]);

      const cap = await capRes.json();
      const roster = await rosterRes.json();
      const cl = await clRes.json();

      if (cap.needsMigration || roster.needsMigration) {
        setNeedsMigration("kaviro_agency_capacity.sql");
        return;
      }
      if (cl.needsMigration) {
        setNeedsMigration((prev) => prev ?? "kaviro_agency_checklist.sql");
      }

      if (capRes.ok) {
        setCapacity({
          maxCapacity: cap.maxCapacity,
          waitlistEnabled: cap.waitlistEnabled,
          counts: cap.counts,
        });
        setMaxInput(cap.maxCapacity != null ? String(cap.maxCapacity) : "");
      }

      if (rosterRes.ok) {
        setTravelers(roster.travelers ?? []);
      }

      if (clRes.ok) {
        setChecklist(cl.items ?? []);
        setCheckProgress(cl.progress ?? { done: 0, total: 0 });
      }
    } catch {
      toast.push({ kind: "error", title: "Error al cargar operaciones" });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveCapacity() {
    setSaving(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/capacity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxCapacity: maxInput.trim() === "" ? null : Number(maxInput),
          waitlistEnabled: capacity?.waitlistEnabled ?? true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      await load();
      toast.push({ kind: "success", title: "Plazas actualizadas" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  async function addTraveler(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/roster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newName.trim(), email: newEmail.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setNewName("");
      setNewEmail("");
      await load();
      toast.push({ kind: "success", title: "Viajero añadido" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(participantId: string, bookingStatus: BookingStatus) {
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/roster`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, bookingStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      await load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    }
  }

  async function seedChecklist() {
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setChecklist(data.items ?? []);
      setCheckProgress(data.progress ?? { done: 0, total: data.items?.length ?? 0 });
      toast.push({ kind: "success", title: "Checklist creado" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    }
  }

  async function toggleCheck(itemId: string, checked: boolean) {
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isChecked: checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setChecklist((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_checked: checked } : i))
      );
      setCheckProgress(data.progress);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (needsMigration) {
    return (
      <div className={`${agencyCardClass} flex gap-3 p-5 text-sm text-amber-900 dark:text-amber-200`}>
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Migración pendiente en Supabase</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Ejecuta <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">docs/{needsMigration}</code> en el
            SQL Editor y recarga esta página.
          </p>
        </div>
      </div>
    );
  }

  const counts = capacity?.counts;
  const occupancyLabel =
    capacity?.maxCapacity != null && capacity.maxCapacity > 0 && counts
      ? `${counts.occupied}/${capacity.maxCapacity} plazas`
      : counts
        ? `${counts.occupied} confirmados`
        : "";

  return (
    <div className="space-y-8">
      <p className={agencyPageSubtitleClass}>
        {tripName}
        {occupancyLabel ? ` · ${occupancyLabel}` : ""}
      </p>

      {/* Cotizaciones */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cotizaciones</h2>
        </div>
        <AgencyTripQuotesSection tripId={tripId} />
      </section>

      {/* Cobros */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cobros (Stripe)</h2>
        </div>
        <AgencyTripPaymentsSection tripId={tripId} />
      </section>

      {/* Emails */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Emails automáticos</h2>
        </div>
        <AgencyTripEmailsSection tripId={tripId} />
      </section>

      {/* Firma digital */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Firma digital</h2>
        </div>
        <AgencyTripSignaturesSection tripId={tripId} />
      </section>

      {/* Plazas */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Plazas y viajeros</h2>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className={agencyLabelClass}>Plazas máximas</span>
            <input
              type="number"
              min={1}
              max={999}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="Sin límite"
              className={`${agencyInputClass} mt-1 w-28`}
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveCapacity()}
            className={agencyBtnSecondaryClass}
          >
            Guardar cupo
          </button>
        </div>

        {counts ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-medium dark:bg-slate-800">
              Ocupadas: {counts.occupied}
            </span>
            <span className="rounded-md bg-amber-500/15 px-2 py-1 font-medium text-amber-900 dark:text-amber-200">
              Interesados: {counts.interested}
            </span>
            <span className="rounded-md bg-violet-500/15 px-2 py-1 font-medium text-violet-900 dark:text-violet-200">
              Lista espera: {counts.waitlist}
            </span>
            {counts.isFull ? (
              <span className="rounded-md bg-red-500/15 px-2 py-1 font-bold text-red-800 dark:text-red-300">
                Completo
              </span>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={addTraveler} className="grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del viajero"
            className={agencyInputClass}
            required
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email (opcional)"
            className={agencyInputClass}
          />
          <button type="submit" disabled={saving} className={`${agencyBtnPrimaryClass} gap-1.5`}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Añadir viajero
          </button>
        </form>

        {travelers.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sin viajeros con estado de reserva. También puedes gestionar participantes en{" "}
            <Link href={`/trip/${tripId}/participants`} className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
              Participantes del viaje
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {travelers.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.display_name}</p>
                  {t.email ? <p className="text-xs text-slate-500">{t.email}</p> : null}
                </div>
                <select
                  value={t.booking_status ?? "interested"}
                  onChange={(e) => void updateStatus(t.id, e.target.value as BookingStatus)}
                  className={`${agencyInputClass} min-w-[10rem] text-xs`}
                >
                  {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}

        {counts && counts.waitlist > 0 && counts.available != null && counts.available > 0 ? (
          <p className="text-xs text-slate-500">
            Hay {counts.waitlist} en lista de espera y {counts.available} plaza(s) libre(s). Cambia su estado a
            Reservado o Confirmado desde el desplegable.
          </p>
        ) : null}
      </section>

      {/* Encuesta pre-viaje */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Encuesta pre-viaje</h2>
        </div>
        <AgencyTripPretravelSection tripId={tripId} />
      </section>

      {/* Checklist */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Checklist pre-salida</h2>
          </div>
          {checkProgress.total > 0 ? (
            <span className="text-xs font-semibold text-slate-500">
              {checkProgress.done}/{checkProgress.total}
            </span>
          ) : null}
        </div>

        {checklist.length === 0 ? (
          <button type="button" onClick={() => void seedChecklist()} className={agencyBtnPrimaryClass}>
            Crear checklist estándar
          </button>
        ) : (
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-100 px-3 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={(e) => void toggleCheck(item.id, e.target.checked)}
                    className="mt-0.5"
                  />
                  <span
                    className={`text-sm ${item.is_checked ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"}`}
                  >
                    {item.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NPS post-viaje */}
      <section className={`${agencyCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Satisfacción (NPS)</h2>
        </div>
        <AgencyTripNpsSection tripId={tripId} />
      </section>
    </div>
  );
}
