import { notFound } from "next/navigation";
import { headers } from "next/headers";
import PrintOnLoad from "./PrintOnLoad";

type Props = { params: { token: string } };

type Trip = {
  id: string;
  name: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
};

type Activity = {
  id: string;
  title: string | null;
  activity_date: string | null;
  activity_time: string | null;
  place_name: string | null;
  address: string | null;
  activity_kind: string | null;
  activity_type: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function groupByDay(activities: Activity[]) {
  const map = new Map<string, Activity[]>();
  for (const a of activities) {
    const d = a.activity_date || "Sin fecha";
    const arr = map.get(d) || [];
    arr.push(a);
    map.set(d, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default async function SharePdfPage({ params }: Props) {
  const token = params.token;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : "";

  const res = await fetch(`${origin}/api/trip-shares/${token}`, { cache: "no-store" }).catch(() => null);
  if (!res) notFound();
  if (res.status === 404) notFound();

  const payload = await res.json().catch(() => null);
  if (!payload?.trip) notFound();

  const trip = payload.trip as Trip;
  const activities = (payload.activities || []) as Activity[];
  const days = groupByDay(activities);

  return (
    <main className="bg-white text-slate-950">
      <PrintOnLoad />
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .no-print { display: none !important; }
          a { color: inherit; text-decoration: none; }
          .cover-page { page-break-after: always; }
          .page-break-before { page-break-before: always; }
        }
        @media screen {
          .cover-page { border-bottom: 2px solid #E2E8F0; margin-bottom: 2rem; }
        }
      `}</style>

      <div className="no-print border-b border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Se abrirá el diálogo de impresión. Elige “Guardar como PDF”.
      </div>

      {/* ── Branded cover page ─────────────────────────────────────── */}
      <div className="cover-page mx-auto max-w-[780px] flex flex-col min-h-[277mm] p-10">
        {/* Kaviro logo */}
        <div className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, fontFamily: "sans-serif", lineHeight: 1 }}>K</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#64748B", letterSpacing: "0.05em" }}>KAVIRO</span>
        </div>

        {/* Main content centered */}
        <div className="flex-1 flex flex-col justify-center">
          {trip.destination && (
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
              {trip.destination}
            </div>
          )}
          <h1 className="text-5xl font-black tracking-tight text-slate-950 leading-tight">
            {trip.name || "Itinerario de viaje"}
          </h1>
          <div className="mt-6 flex flex-wrap gap-4">
            {trip.start_date && (
              <div className="rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Desde</div>
                <div className="mt-0.5 text-base font-bold text-slate-800">{formatDate(trip.start_date)}</div>
              </div>
            )}
            {trip.end_date && (
              <div className="rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Hasta</div>
                <div className="mt-0.5 text-base font-bold text-slate-800">{formatDate(trip.end_date)}</div>
              </div>
            )}
            {activities.length > 0 && (
              <div className="rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Actividades</div>
                <div className="mt-0.5 text-base font-bold text-slate-800">{activities.length}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-400">
          Generado con Kaviro · kaviro.app · {new Date().toLocaleDateString("es-ES")}
        </div>
      </div>

      {/* ── Itinerary pages ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-[780px] p-6 page-break-before">

        {days.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
            Este viaje todavía no tiene actividades en el plan.
          </div>
        ) : (
          <div className="space-y-6">
            {days.map(([day, rows]) => (
              <section key={day}>
                <h2 className="text-lg font-bold">{day === "Sin fecha" ? "Sin fecha" : formatDate(day)}</h2>
                <div className="mt-3 space-y-2">
                  {rows.map((a) => (
                    <div key={a.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold">{a.title || a.place_name || "Actividad"}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {(a.place_name || a.address || "Ubicación pendiente") +
                              (a.activity_time ? ` · ${a.activity_time.slice(0, 5)}` : "")}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-600">
                          {a.activity_kind || a.activity_type || ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      </div>
    </main>
  );
}

