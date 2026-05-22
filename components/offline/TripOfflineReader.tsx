"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Hotel, WifiOff } from "lucide-react";
import { getTripOfflineBundle } from "@/lib/offline/db";
import type { TripOfflineBundle } from "@/lib/offline/types";
import type { TripActivity } from "@/hooks/useTripActivities";

type Tab = "plan" | "lists" | "reservations";

function todayYMD() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function formatSyncDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatDayLabel(dateKey: string) {
  if (dateKey === "Sin fecha") return "Sin fecha";
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

function formatTime(t: string | null | undefined) {
  if (!t) return "";
  return t.slice(0, 5);
}

function PlanDaySection({ dateKey, items }: { dateKey: string; items: TripActivity[] }) {
  return (
    <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{formatDayLabel(dateKey)}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((a) => (
          <li key={a.id} className="border-l-2 border-[var(--brand)] pl-3">
            <p className="font-semibold text-[var(--text-primary)]">{a.title}</p>
            {a.activity_time ? (
              <p className="text-xs text-[var(--text-secondary)]">{formatTime(a.activity_time)}</p>
            ) : null}
            {a.place_name || a.address ? (
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                {[a.place_name, a.address].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {a.description ? (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{a.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TripOfflineReader({ tripId }: { tripId: string }) {
  const [bundle, setBundle] = useState<TripOfflineBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("plan");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const b = await getTripOfflineBundle(tripId);
      if (!cancelled) {
        setBundle(b);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const today = todayYMD();

  const todayActivities = useMemo(() => {
    if (!bundle) return [];
    return bundle.activities
      .filter((a) => (a.activity_date || "") === today)
      .sort((a, b) => String(a.activity_time || "").localeCompare(String(b.activity_time || "")));
  }, [bundle, today]);

  const upcomingByDay = useMemo(() => {
    if (!bundle) return [];
    const map = new Map<string, TripActivity[]>();
    for (const a of bundle.activities) {
      const d = a.activity_date || "Sin fecha";
      if (d !== "Sin fecha" && d < today) continue;
      if (d === today) continue;
      const prev = map.get(d) ?? [];
      prev.push(a);
      map.set(d, prev);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5);
  }, [bundle, today]);

  if (loading) {
    return (
      <div className="page-shell page-shell--safe-top py-10 text-center text-sm text-[var(--text-secondary)]">
        Cargando datos guardados…
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="page-shell page-shell--safe-top py-10 text-center">
        <WifiOff className="mx-auto h-10 w-10 text-amber-500" aria-hidden />
        <h1 className="mt-4 text-lg font-bold text-[var(--text-primary)]">Sin datos offline</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
          Abre este viaje al menos una vez con conexión (hotel o WiFi). La app guardará plan, listas y
          reservas para consultarlos sin internet.
        </p>
        <Link
          href="/offline-viaje"
          className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white"
        >
          Ver otros viajes guardados
        </Link>
      </div>
    );
  }

  const tripName = bundle.trip?.name ?? "Viaje";

  return (
    <div className="min-h-dvh bg-[var(--surface-page)] pb-8">
      <header
        className="sticky-safe-top border-b border-[var(--border-default)] bg-[var(--surface-card)]/95 px-safe-inline backdrop-blur"
      >
        <div className="mx-auto max-w-lg py-3">
          <div className="flex items-start gap-2">
            <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Modo sin conexión · solo lectura
              </p>
              <h1 className="truncate text-lg font-extrabold text-[var(--text-primary)]">{tripName}</h1>
              <p className="text-xs text-[var(--text-tertiary)]">
                Guardado {formatSyncDate(bundle.syncedAt)}
              </p>
            </div>
          </div>
          <Link
            href="/offline-viaje"
            className="mt-2 inline-block text-xs font-semibold text-[var(--brand)]"
          >
            ← Mis viajes guardados
          </Link>
        </div>
        <nav className="mx-auto flex max-w-lg gap-1 px-safe-inline pb-2">
          {(
            [
              { id: "plan" as const, label: "Plan", icon: CalendarDays },
              { id: "lists" as const, label: "Listas", icon: ClipboardList },
              { id: "reservations" as const, label: "Reservas", icon: Hotel },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                tab === id
                  ? "bg-[var(--brand)] text-white"
                  : "bg-[var(--surface-page)] text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-shell mx-auto max-w-lg space-y-4 !pt-4">
        {tab === "plan" ? (
          <>
            <section>
              <h2 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Hoy</h2>
              {todayActivities.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border-default)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  No hay actividades programadas para hoy en los datos guardados.
                </p>
              ) : (
                <PlanDaySection dateKey={today} items={todayActivities} />
              )}
            </section>
            {upcomingByDay.length > 0 ? (
              <section>
                <h2 className="mb-2 text-sm font-bold text-[var(--text-primary)]">Próximos días</h2>
                <div className="space-y-3">
                  {upcomingByDay.map(([dateKey, items]) => (
                    <PlanDaySection key={dateKey} dateKey={dateKey} items={items} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {tab === "lists" ? (
          <div className="space-y-4">
            {bundle.lists.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-secondary)]">No hay listas guardadas.</p>
            ) : (
              bundle.lists.map((list) => {
                const items = bundle.listItemsByListId[list.id] ?? [];
                const done = items.filter((i) => i.is_done).length;
                return (
                  <section
                    key={list.id}
                    className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
                  >
                    <h3 className="font-bold text-[var(--text-primary)]">{list.title}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {done}/{items.length} hechos
                    </p>
                    <ul className="mt-3 space-y-2">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className={`text-sm ${item.is_done ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]"}`}
                        >
                          {item.text}
                          {item.qty != null ? ` ×${item.qty}` : ""}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "reservations" ? (
          <div className="space-y-3">
            {bundle.reservations.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-secondary)]">
                No hay reservas guardadas.
              </p>
            ) : (
              bundle.reservations.map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
                >
                  <h3 className="font-bold text-[var(--text-primary)]">{r.reservation_name}</h3>
                  {r.provider_name ? (
                    <p className="text-sm text-[var(--text-secondary)]">{r.provider_name}</p>
                  ) : null}
                  {(r.check_in_date || r.check_in_time) && (
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      Entrada: {[r.check_in_date, r.check_in_time].filter(Boolean).join(" ")}
                    </p>
                  )}
                  {(r.check_out_date || r.check_out_time) && (
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Salida: {[r.check_out_date, r.check_out_time].filter(Boolean).join(" ")}
                    </p>
                  )}
                  {r.reservation_code ? (
                    <p className="mt-2 font-mono text-sm font-semibold text-[var(--brand-text)]">
                      {r.reservation_code}
                    </p>
                  ) : null}
                  {r.address || r.city ? (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {[r.address, r.city, r.country].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
