export const QUOTE_LINE_CATEGORIES = [
  "flight",
  "hotel",
  "transport",
  "tickets",
  "guide",
  "insurance",
  "management",
  "other",
] as const;

export type QuoteLineCategory = (typeof QUOTE_LINE_CATEGORIES)[number];

export const QUOTE_CATEGORY_LABELS: Record<QuoteLineCategory, string> = {
  flight: "Vuelos",
  hotel: "Alojamiento",
  transport: "Transporte",
  tickets: "Entradas / eventos",
  guide: "Guías",
  insurance: "Seguro",
  management: "Gastos de gestión",
  other: "Otros",
};

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Caducada",
};

export const AGENCY_SALES_STATUSES = ["draft", "proposal", "confirmed", "cancelled"] as const;
export type AgencySalesStatus = (typeof AGENCY_SALES_STATUSES)[number];

export type QuoteLineInput = {
  category: QuoteLineCategory;
  label: string;
  description?: string | null;
  unit_amount: number;
  quantity: number;
};

export function lineSubtotal(unit: number, qty: number): number {
  return Math.round(unit * qty * 100) / 100;
}

export function computeQuoteTotals(opts: {
  lines: Array<{ unit_amount: number; quantity: number }>;
  travelersCount: number | null;
  discountPercent: number;
}): { subtotal: number; discountAmount: number; total: number; pricePerPerson: number | null } {
  const subtotal = opts.lines.reduce(
    (sum, l) => sum + lineSubtotal(Number(l.unit_amount), Number(l.quantity)),
    0
  );
  const discountAmount = Math.round(subtotal * (opts.discountPercent / 100) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  const pricePerPerson =
    opts.travelersCount && opts.travelersCount > 0
      ? Math.round((total / opts.travelersCount) * 100) / 100
      : null;
  return { subtotal, discountAmount, total, pricePerPerson };
}

export function generateQuoteAcceptToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function quoteAcceptPath(token: string) {
  return `/quote/${token}`;
}

export function quotePdfPath(token: string) {
  return `/quote/${token}/pdf`;
}

export function isQuoteExpired(validUntil: string | null): boolean {
  if (!validUntil) return false;
  const today = new Date().toISOString().slice(0, 10);
  return validUntil < today;
}

export const DEFAULT_QUOTE_LINE_TEMPLATE: QuoteLineInput[] = [
  { category: "flight", label: "Vuelos", unit_amount: 0, quantity: 1 },
  { category: "hotel", label: "Alojamiento", unit_amount: 0, quantity: 1 },
  { category: "transport", label: "Transporte en destino", unit_amount: 0, quantity: 1 },
  { category: "tickets", label: "Entradas / actividades", unit_amount: 0, quantity: 1 },
  { category: "management", label: "Gastos de gestión", unit_amount: 0, quantity: 1 },
];
