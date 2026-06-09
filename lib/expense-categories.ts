/** Etiquetas en castellano para categorías de gasto (mismas que en el formulario). */
const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  food: "Comida",
  meals: "Comida",
  restaurant: "Restaurante",
  transport: "Transporte",
  transportation: "Transporte",
  lodging: "Alojamiento",
  accommodation: "Alojamiento",
  tickets: "Entradas",
  ticket: "Entradas",
  shopping: "Compras",
  groceries: "Supermercado",
  supermarket: "Supermercado",
  activities: "Actividades",
  activity: "Actividades",
  misc: "Otros",
  other: "Otros",
  others: "Otros",
};

export function expenseCategoryLabel(raw: string | null | undefined): string {
  const key = String(raw || "").trim().toLowerCase();
  if (!key) return "Sin categoría";
  const found = EXPENSE_CATEGORY_LABELS[key];
  if (found) return found;
  return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
