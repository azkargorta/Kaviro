export type CreateTripOpenMode = "travel" | "expenses";

/** Abre el formulario de crear viaje en el dashboard (scroll + estado interno). */
export function openCreateTripForm(options?: { mode?: CreateTripOpenMode }) {
  if (typeof window === "undefined") return;
  const mode = options?.mode === "expenses" ? "expenses" : "travel";
  window.dispatchEvent(new CustomEvent("kaviro:open-create-trip", { detail: { mode } }));
  const hash = mode === "expenses" ? "#create-trip-expenses" : "#create-trip";
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
  window.requestAnimationFrame(() => {
    document.getElementById("create-trip")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
