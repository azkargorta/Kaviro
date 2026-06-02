import { notFound } from "next/navigation";
import PrintOnLoad from "@/app/share/[token]/pdf/PrintOnLoad";
import { agencyBrandingFromRow } from "@/lib/agency";
import {
  formatClientPortalDate,
  groupClientPortalDays,
  loadAgencyClientPortal,
} from "@/lib/load-agency-client-portal";
import { AGENCY_NAVY } from "@/lib/agency-theme";

type Props = { params: { agency: string; trip: string } };

export default async function ClientPortalPdfPage({ params }: Props) {
  const data = await loadAgencyClientPortal(params.agency, params.trip);
  if (!data) notFound();

  const branding = agencyBrandingFromRow(data.agency);
  const accent = branding.brandColor || AGENCY_NAVY;
  const days = groupClientPortalDays(data.activities).map(([day, rows]) => ({
    key: day,
    label: day === "Sin fecha" ? "Sin fecha" : formatClientPortalDate(day),
    rows,
  }));

  const dateRange = `${formatClientPortalDate(data.trip.start_date)} — ${formatClientPortalDate(data.trip.end_date)}`;

  return (
    <main style={{ background: "#fff", color: "#0f172a", fontFamily: "Georgia, serif" }}>
      <PrintOnLoad />
      <style>{`
        @page { size: A4; margin: 18mm; }
        @media print { .no-print { display: none; } }
        h1 { font-size: 22px; margin: 0 0 8px; color: ${accent}; }
        .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
        .day { margin-top: 20px; page-break-inside: avoid; }
        .day h2 { font-size: 14px; border-bottom: 2px solid ${accent}; padding-bottom: 4px; }
        .item { margin: 10px 0; font-size: 12px; }
        .time { font-weight: bold; color: ${accent}; }
      `}</style>

      <header style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#64748b" }}>
          {branding.name}
        </p>
        <h1>{data.trip.name || "Programa del viaje"}</h1>
        <p className="meta">
          {data.trip.destination || ""} · {dateRange}
        </p>
      </header>

      {days.map((day) => (
        <section key={day.key} className="day">
          <h2>{day.label}</h2>
          {day.rows.map((a) => (
            <div key={a.id} className="item">
              {a.activity_time ? <span className="time">{a.activity_time.slice(0, 5)} · </span> : null}
              <strong>{a.title || a.place_name || "Actividad"}</strong>
              {a.place_name && a.title ? <span> — {a.place_name}</span> : null}
              {a.address ? <div style={{ color: "#64748b" }}>{a.address}</div> : null}
            </div>
          ))}
        </section>
      ))}

      <footer style={{ marginTop: 32, fontSize: 10, color: "#94a3b8" }}>
        Documento generado por {branding.name}. Programa sujeto a cambios.
      </footer>
    </main>
  );
}
