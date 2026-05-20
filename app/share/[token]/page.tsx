import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { APP_NAME } from "@/lib/brand";

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

export async function generateMetadata({ params }: Props) {
  try {
    const { createClient: sc } = await import("@/lib/supabase/server");
    const supabase = await sc();
    const { data: share } = await supabase
      .from("trip_shares")
      .select("trip_id, trips(name, destination, start_date)")
      .eq("token", params.token)
      .maybeSingle();
    const trip = (share as any)?.trips;
    if (!trip) return { title: `Itinerario | ${APP_NAME}` };
    const dest = trip.destination ? ` — ${trip.destination}` : "";
    const title = `${trip.name}${dest} | Itinerario compartido en ${APP_NAME}`;
    const description = `Ver el plan, rutas y actividades de ${trip.name}${dest}. Organizado con ${APP_NAME}.`;
    // Build og:image URL using the recap image API
    const ogImageParams = new URLSearchParams({
      tripName: trip.name || "Mi viaje",
      destination: trip.destination || "",
      startDate: trip.start_date || "",
      format: "square",
    });
    const ogImage = `/api/trip-recap-image?${ogImageParams.toString()}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: APP_NAME,
        images: [{ url: ogImage, width: 1080, height: 1080, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    };
  } catch {
    return { title: `Itinerario compartido | ${APP_NAME}` };
  }
}


export default async function SharePage({ params }: Props) {
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
    <main className="min-h-[100svh] bg-slate-50 dark:bg-[#080C14]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:border-[#1E293B] dark:bg-[#0F1623]/95">
        <div className="mx-auto max-w-[980px] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Itinerario público</div>
              <h1 className="truncate text-xl font-extrabold text-slate-950 dark:text-white">{trip.name || "Viaje"}</h1>
              <p className="mt-0.5 text-sm text-slate-600">
                {(trip.destination || "Destino pendiente") + " · " + `${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/share/${encodeURIComponent(token)}/pdf`}
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Exportar PDF
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                Abrir en {APP_NAME}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[980px] space-y-5 px-4 py-6 sm:px-6">
        {days.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-400">
            Este viaje todavía no tiene actividades en el plan.
          </div>
        ) : (
          days.map(([day, rows]) => (
            <section key={day} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[#1E293B] dark:bg-[#0F1623]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">{day === "Sin fecha" ? "Sin fecha" : formatDate(day)}</h2>
                  <p className="mt-1 text-sm text-slate-600">{rows.length} actividad{rows.length === 1 ? "" : "es"}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {rows.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E293B] dark:bg-[#080C14]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-950 dark:text-white">
                          {a.title || a.place_name || "Actividad"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {(a.place_name || a.address || "Ubicación pendiente") +
                            (a.activity_time ? ` · ${a.activity_time.slice(0, 5)}` : "")}
                        </div>
                      </div>
                      <span className="rounded-full bg-white dark:bg-[#1E293B] px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        {a.activity_kind || a.activity_type || "Plan"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </main>
  );
}

