/** Paleta para carpetas del explorador (valor guardado en trip_place_folders.color). */
export const FOLDER_COLOR_OPTIONS = [
  { id: "slate", value: "#64748b", label: "Gris" },
  { id: "violet", value: "#8b5cf6", label: "Violeta" },
  { id: "sky", value: "#0ea5e9", label: "Azul" },
  { id: "emerald", value: "#10b981", label: "Verde" },
  { id: "amber", value: "#f59e0b", label: "Ámbar" },
  { id: "rose", value: "#f43f5e", label: "Rosa" },
] as const;

export function folderColorOrDefault(color: string | null | undefined) {
  const c = (color || "").trim();
  if (c && /^#[0-9a-f]{3,8}$/i.test(c)) return c;
  return FOLDER_COLOR_OPTIONS[0].value;
}
