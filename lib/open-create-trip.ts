/** Abre el formulario de crear viaje en el dashboard (scroll + estado interno). */
export function openCreateTripForm() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kaviro:open-create-trip"));
  if (window.location.hash !== "#create-trip") {
    window.location.hash = "create-trip";
  }
  window.requestAnimationFrame(() => {
    document.getElementById("create-trip")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
