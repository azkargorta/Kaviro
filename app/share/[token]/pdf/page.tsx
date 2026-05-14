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
  description: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateShort(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
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

const KIND_ICON: Record<string, string> = {
  culture: "🏛️", nature: "🌿", viewpoint: "🌄", restaurant: "🍽️",
  museum: "🏛️", shopping: "🛍️", night: "🌙", lodging: "🏨",
  activity: "🎟️", transport: "🚆", gastro_experience: "🍷",
  excursion: "🚌", market: "🧺", neighborhood: "🧭", visit: "📍",
};

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

  const totalDays = trip.start_date && trip.end_date
    ? Math.round((new Date(`${trip.end_date}T00:00:00`).getTime() - new Date(`${trip.start_date}T00:00:00`).getTime()) / 86400000) + 1
    : null;

  return (
    <main style={{ background: "#fff", color: "#0f172a", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <PrintOnLoad />
      <style>{`
        * { box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .cover { page-break-after: always; page-break-inside: avoid; }
          .activity-card { break-inside: avoid; page-break-inside: avoid; }
          .day-section { break-inside: avoid-page; }
          a { color: inherit; text-decoration: none; }
        }
        @media screen {
          .cover { border-bottom: 3px solid #F87171; margin-bottom: 2rem; }
          body { max-width: 210mm; margin: 0 auto; }
        }
        .cover {
          width: 100%;
          height: 297mm;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .cover-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        }
        .cover-accent {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(248,113,113,0.3) 0%, transparent 70%);
        }
        .cover-accent2 {
          position: absolute;
          bottom: -60px;
          left: -60px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(248,113,113,0.15) 0%, transparent 70%);
        }
        .cover-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 48px 56px;
        }
        .logo-mark {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: #F87171;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(248,113,113,0.4);
        }
        .logo-k {
          color: #fff;
          font-weight: 900;
          font-size: 28px;
          font-family: sans-serif;
          line-height: 1;
          letter-spacing: -0.05em;
        }
        .logo-name {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.2em;
          font-family: sans-serif;
          margin-top: 10px;
        }
        .cover-main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .cover-destination {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: #F87171;
          text-transform: uppercase;
          margin-bottom: 20px;
          font-family: sans-serif;
        }
        .cover-title {
          font-size: 52px;
          font-weight: 900;
          line-height: 1.05;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 32px;
          font-family: sans-serif;
        }
        .cover-tagline {
          font-size: 16px;
          color: rgba(255,255,255,0.45);
          font-style: italic;
          margin-bottom: 40px;
          font-family: Georgia, serif;
        }
        .cover-pills { display: flex; gap: 12px; flex-wrap: wrap; }
        .cover-pill {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 10px 18px;
        }
        .pill-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          font-family: sans-serif;
        }
        .pill-value {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          margin-top: 3px;
          font-family: sans-serif;
        }
        .cover-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 20px;
        }
        .footer-text {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          font-family: sans-serif;
        }
        .footer-url {
          font-size: 11px;
          font-weight: 600;
          color: rgba(248,113,113,0.6);
          font-family: sans-serif;
        }
        .itinerary { padding: 40px 56px; }
        .day-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #F87171;
        }
        .day-number {
          font-size: 11px;
          font-weight: 800;
          color: #F87171;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-family: sans-serif;
          white-space: nowrap;
        }
        .day-date {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          font-family: sans-serif;
          text-transform: capitalize;
        }
        .activity-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 10px;
          background: #fff;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .act-header { display: flex; align-items: flex-start; gap: 12px; }
        .act-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .act-body { flex: 1; min-width: 0; }
        .act-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          font-family: sans-serif;
          line-height: 1.3;
        }
        .act-meta {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
          font-family: sans-serif;
        }
        .act-time {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: #F87171;
          border-radius: 6px;
          padding: 2px 8px;
          font-family: sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .act-description {
          margin-top: 8px;
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          font-family: Georgia, serif;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
        }
        .day-section { margin-bottom: 32px; }
      `}</style>

      {/* ── Banner de pantalla (no se imprime) ── */}
      <div className="no-print" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
        <span>📄</span>
        <span>Se abrirá el diálogo de impresión. Elige <strong>Guardar como PDF</strong> para descargar.</span>
      </div>

      {/* ── Portada ── */}
      <div className="cover">
        <div className="cover-bg" />
        <div className="cover-accent" />
        <div className="cover-accent2" />
        <div className="cover-content">
          {/* Logo */}
          <div>
            <div className="logo-mark">
              <span className="logo-k">K</span>
            </div>
            <div className="logo-name">KAVIRO</div>
          </div>

          {/* Contenido central */}
          <div className="cover-main">
            {trip.destination && (
              <div className="cover-destination">{trip.destination}</div>
            )}
            <div className="cover-title">{trip.name || "Itinerario de viaje"}</div>
            <div className="cover-tagline">
              &ldquo;Cada viaje es una historia que aún no has contado.&rdquo;
            </div>
            <div className="cover-pills">
              {trip.start_date && (
                <div className="cover-pill">
                  <div className="pill-label">Desde</div>
                  <div className="pill-value">{formatDateShort(trip.start_date)}</div>
                </div>
              )}
              {trip.end_date && (
                <div className="cover-pill">
                  <div className="pill-label">Hasta</div>
                  <div className="pill-value">{formatDateShort(trip.end_date)}</div>
                </div>
              )}
              {totalDays && (
                <div className="cover-pill">
                  <div className="pill-label">Duración</div>
                  <div className="pill-value">{totalDays} {totalDays === 1 ? "día" : "días"}</div>
                </div>
              )}
              {activities.length > 0 && (
                <div className="cover-pill">
                  <div className="pill-label">Actividades</div>
                  <div className="pill-value">{activities.length}</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer portada */}
          <div className="cover-footer">
            <span className="footer-text">Generado el {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</span>
            <span className="footer-url">kaviro.app</span>
          </div>
        </div>
      </div>

      {/* ── Itinerario ── */}
      <div className="itinerary">
        {days.length === 0 ? (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, color: "#64748b", fontSize: 14, fontFamily: "sans-serif" }}>
            Este viaje todavía no tiene actividades en el plan.
          </div>
        ) : (
          days.map(([day, rows], dayIdx) => (
            <div key={day} className="day-section">
              <div className="day-header">
                <span className="day-number">Día {dayIdx + 1}</span>
                <span className="day-date">{day === "Sin fecha" ? "Sin fecha asignada" : formatDate(day)}</span>
              </div>
              {rows.map((a) => (
                <div key={a.id} className="activity-card">
                  <div className="act-header">
                    <div className="act-icon">
                      {KIND_ICON[a.activity_kind ?? ""] || "📍"}
                    </div>
                    <div className="act-body">
                      <div className="act-title">{a.title || a.place_name || "Actividad"}</div>
                      {(a.place_name || a.address) && (
                        <div className="act-meta">
                          📍 {a.place_name || a.address}
                        </div>
                      )}
                    </div>
                    {a.activity_time && (
                      <div className="act-time">{a.activity_time.slice(0, 5)}</div>
                    )}
                  </div>
                  {a.description && (
                    <div className="act-description">{a.description}</div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
