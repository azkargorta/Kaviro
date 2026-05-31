export type DetectedDocumentData = {
  type?: string;
  documentType?: string;
  provider?: string | null;
  providerName?: string | null;
  name?: string | null;
  title?: string | null;
  reservationName?: string | null;
  code?: string | null;
  reservationCode?: string | null;
  totalPrice?: number | null;
  totalAmount?: number | null;
  currency?: string | null;
  checkInDate?: string | null;
  checkInTime?: string | null;
  checkOutDate?: string | null;
  checkOutTime?: string | null;
  location?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  guests?: number | null;
  paymentStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  destination?: string | null;
  departureDate?: string | null;
  activityDate?: string | null;
  arrivalDate?: string | null;
  confidence?: number;
  rawText?: string;
  extractedText?: string;
  extractionWarning?: string | null;
  detectedData?: Record<string, unknown> | null;
};

function extractPrice(text: string) {
  const priceRegex =
    /(grand total|total price|importe total|precio total|amount due|total|importe|amount|precio)[^0-9]{0,20}([0-9]+[.,][0-9]{2})/i;
  const match = text.match(priceRegex);
  if (!match) return null;
  return parseFloat(match[2].replace(",", "."));
}

function extractDates(text: string) {
  const isoMatches = [...text.matchAll(/\b(20\d{2})[-/](\d{2})[-/](\d{2})\b/g)].map(
    (m) => `${m[1]}-${m[2]}-${m[3]}`
  );
  if (isoMatches.length >= 2) return { checkInDate: isoMatches[0], checkOutDate: isoMatches[1] };
  const dmyMatches = [...text.matchAll(/\b(\d{2})[/](\d{2})[/](20\d{2})\b/g)].map(
    (m) => `${m[3]}-${m[2]}-${m[1]}`
  );
  if (dmyMatches.length >= 2) return { checkInDate: dmyMatches[0], checkOutDate: dmyMatches[1] };
  return { checkInDate: null, checkOutDate: null };
}

function extractReservationCode(text: string): string | null {
  const patterns = [
    /\b(?:PNR|localizador|booking(?:\s+ref)?|confirmation|confirmaci[oó]n|record locator)[:\s#-]*([A-Z0-9]{5,8})\b/i,
    /\b([A-Z]{6})\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1] && m[1].length >= 5) return m[1].toUpperCase();
  }
  return null;
}

function detectProvider(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("aerolíneas argentinas") || lower.includes("aerolineas argentinas")) return "Aerolíneas Argentinas";
  if (lower.includes("iberia")) return "Iberia";
  if (lower.includes("booking")) return "Booking";
  if (lower.includes("airbnb")) return "Airbnb";
  if (lower.includes("ryanair")) return "Ryanair";
  if (lower.includes("renfe")) return "Renfe";
  if (lower.includes("stripes")) return "Stripes";
  return null;
}

function detectDocumentType(text: string, fileName?: string | null): string {
  const blob = `${fileName || ""}\n${text}`.toLowerCase();
  const dayHeaders =
    (blob.match(/(?:^|\n)\s*(?:d[ií]a|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+\d/i) || [])
      .length;
  const timeHits = (blob.match(/\d{1,2}[.:]\d{2}\s*h\b/gi) || []).length;
  if (
    /\bitinerario\b|\bcalendario\b|\bagenda\b|\bexcursi[oó]n\b|\bquedada\b|\bd[ií]a libre\b/i.test(blob) ||
    (dayHeaders >= 2 && timeHits >= 3)
  ) {
    return "travel_itinerary";
  }
  if (/\bvuelo\b|\bflight\b|\bboarding\b|\bpnr\b|\baeropuerto\b|\bt1\b|\bterminal\b/i.test(blob)) {
    return "flight_ticket";
  }
  if (/\bhotel\b|\bcheck[- ]?in\b|\bcheck[- ]?out\b|\balojamiento\b|\bhabitaci[oó]n\b/i.test(blob)) {
    return "hotel_reservation";
  }
  return "travel_document";
}

export function analyzeDocumentText(rawText: string, fileName?: string | null): DetectedDocumentData {
  const provider = detectProvider(rawText);
  const price = extractPrice(rawText);
  const { checkInDate, checkOutDate } = extractDates(rawText);
  const reservationCode = extractReservationCode(rawText);
  const documentType = detectDocumentType(rawText, fileName);
  const titleGuess =
    rawText.match(/(?:CALENDARIO|ITINERARIO|TRIP TO|VIAJE A)\s+([^\n]{3,60})/i)?.[1]?.trim() ||
    fileName?.replace(/\.[^.]+$/, "") ||
    null;

  return {
    type: documentType,
    documentType,
    provider,
    providerName: provider,
    name: titleGuess,
    title: titleGuess,
    reservationName: titleGuess,
    code: reservationCode,
    reservationCode,
    totalPrice: price,
    totalAmount: price,
    currency: rawText.includes("$") ? "USD" : rawText.includes("£") ? "GBP" : "EUR",
    checkInDate,
    checkOutDate,
    location: null,
    address: null,
    guests: null,
    paymentStatus: null,
    confidence: documentType === "travel_itinerary" ? 0.82 : 0.65,
    rawText,
    extractedText: rawText,
    detectedData: null,
    extractionWarning: null,
  };
}

export function analyzeTravelDocument(rawText: string, fileName?: string | null) {
  return analyzeDocumentText(rawText, fileName);
}
