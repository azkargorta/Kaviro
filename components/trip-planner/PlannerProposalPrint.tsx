"use client";

import type { PlannerProposalSnapshot } from "@/lib/trip-ai/plannerProposalStorage";

const KIND_ICON: Record<string, string> = {
  culture: "🏛️",
  nature: "🌿",
  viewpoint: "🌄",
  restaurant: "🍽️",
  museum: "🏛️",
  shopping: "🛍️",
  night: "🌙",
  lodging: "🏨",
  activity: "🎟️",
  transport: "🚆",
  gastro_experience: "🍷",
  excursion: "🚌",
  market: "🧺",
  neighborhood: "🧭",
  visit: "📍",
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function PlannerProposalPrint({ snapshot }: { snapshot: PlannerProposalSnapshot }) {
  return (
    <main style={{ background: "#fff", color: "#0f172a", fontFamily: "Georgia, 'Times New Roman', serif", padding: "24px 28px" }}>
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          .no-print { display: none !important; }
          .root-header, [data-cookie-banner] { display: none !important; }
        }
      `}</style>
      <header style={{ borderBottom: "3px solid #F87171", paddingBottom: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
          Kaviro · Propuesta de itinerario
        </p>
        <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{snapshot.title}</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>
          {snapshot.destination}
          {snapshot.startDate && snapshot.endDate
            ? ` · ${formatDate(snapshot.startDate)} — ${formatDate(snapshot.endDate)}`
            : ""}
        </p>
      </header>

      {snapshot.briefSummary.length ? (
        <section style={{ marginBottom: 20, fontSize: 13, color: "#334155" }}>
          {snapshot.briefSummary.map((line) => (
            <p key={line} style={{ margin: "4px 0" }}>
              {line}
            </p>
          ))}
        </section>
      ) : null}

      {snapshot.days.map((d) => (
        <section key={d.day} style={{ marginBottom: 18, breakInside: "avoid" }}>
          <h2 style={{ fontSize: 15, margin: "0 0 8px", color: "#0f172a" }}>
            Día {d.day}
            {d.date ? ` · ${formatDate(d.date)}` : ""}
            {d.base ? ` · ${d.base}` : ""}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.45 }}>
            {d.items.map((it, i) => (
              <li key={`${d.day}-${i}`} style={{ marginBottom: 6 }}>
                <strong>
                  {(KIND_ICON[it.activity_kind || ""] || "📍") + " "}
                  {it.activity_time ? `${it.activity_time.slice(0, 5)} · ` : ""}
                  {it.title}
                </strong>
                {it.place_name && it.place_name !== it.title ? ` — ${it.place_name}` : ""}
                {it.description ? <div style={{ color: "#64748b", fontSize: 12 }}>{it.description}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p style={{ marginTop: 28, fontSize: 11, color: "#94a3b8" }}>
        Borrador generado con IA. Verifica horarios, desplazamientos y reservas. No es una reserva ni un presupuesto.
      </p>
    </main>
  );
}
