import { generatePretravelToken } from "@/lib/agency/pretravel-defaults";

export const SIGNATURE_DOCUMENT_TYPES = ["contract", "waiver", "custom"] as const;
export type SignatureDocumentType = (typeof SIGNATURE_DOCUMENT_TYPES)[number];

export const SIGNATURE_TYPE_LABELS: Record<SignatureDocumentType, string> = {
  contract: "Contrato de viaje",
  waiver: "Exención de responsabilidad",
  custom: "Documento personalizado",
};

export const DEFAULT_SIGNATURE_BODY: Record<SignatureDocumentType, string> = {
  contract: `CONTRATO DE PARTICIPACIÓN EN VIAJE ORGANIZADO

El/la viajero declara haber leído las condiciones generales del viaje, el programa, precio y política de cancelación facilitados por la agencia organizadora.

Se compromete a:
• Facilitar documentación de identidad y visados cuando corresponda.
• Respetar las normas del grupo y horarios acordados.
• Abonar los pagos en las fechas indicadas.

La agencia actúa como organizadora del viaje combinado según la normativa aplicable. Las reclamaciones deberán dirigirse por escrito a la agencia en un plazo razonable tras la finalización del viaje.

Al firmar digitalmente este documento, el viajero confirma su aceptación de estas condiciones.`,
  waiver: `DECLARACIÓN DE RESPONSABILIDAD Y ASUNCIÓN DE RIESGOS

Declaro que participo en el viaje por voluntad propia, que mi estado de salud me permite realizar las actividades previstas y que dispondré del seguro de viaje recomendado por la agencia.

Eximo a la agencia organizadora de responsabilidad por incidentes derivados de negligencia propia, enfermedades preexistentes no comunicadas, o causas de fuerza mayor, sin perjuicio de los derechos irrenunciables que me correspondan por ley.

He sido informado/a de los riesgos inherentes a las actividades incluidas en el programa.`,
  custom: `DOCUMENTO A FIRMAR

[Añade aquí el texto legal o informativo que debe aceptar y firmar el viajero.]

Al firmar, el viajero confirma haber leído y comprendido el contenido.`,
};

export function generateSignatureToken() {
  return generatePretravelToken();
}

export function signPublicPath(token: string) {
  return `/sign/${token}`;
}

export function isSignatureDocumentType(value: unknown): value is SignatureDocumentType {
  return typeof value === "string" && (SIGNATURE_DOCUMENT_TYPES as readonly string[]).includes(value);
}

const MAX_SIGNATURE_DATA_URL_LEN = 280_000;

export function validateSignatureDataUrl(dataUrl: unknown): string | null {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
    return "Firma no válida (formato PNG requerido).";
  }
  if (dataUrl.length > MAX_SIGNATURE_DATA_URL_LEN) {
    return "La firma es demasiado grande. Vuelve a dibujarla.";
  }
  return null;
}

export function signatureProgress(rows: Array<{ signed_at: string | null }>) {
  const total = rows.length;
  const signed = rows.filter((r) => r.signed_at).length;
  return { signed, total, pending: total - signed };
}
