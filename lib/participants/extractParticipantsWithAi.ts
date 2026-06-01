import { askTripAIWithUsage, type TripAiUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { ParticipantImportRow } from "@/lib/participants/participantImportTypes";

function normalizeRow(raw: unknown): ParticipantImportRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const display_name =
    typeof o.display_name === "string"
      ? o.display_name.trim()
      : typeof o.name === "string"
        ? o.name.trim()
        : typeof o.nombre === "string"
          ? o.nombre.trim()
          : "";
  if (!display_name || display_name.length < 2) return null;

  const email =
    typeof o.email === "string" && o.email.trim()
      ? o.email.trim().toLowerCase()
      : typeof o.correo === "string" && o.correo.trim()
        ? o.correo.trim().toLowerCase()
        : null;

  const phone =
    typeof o.phone === "string" && o.phone.trim()
      ? o.phone.trim()
      : typeof o.telefono === "string" && o.telefono.trim()
        ? o.telefono.trim()
        : typeof o.teléfono === "string" && o.teléfono.trim()
          ? o.teléfono.trim()
          : null;

  return { display_name, email, phone };
}

export function parseParticipantsFromAiJson(text: string): ParticipantImportRow[] {
  const raw = extractJsonObject(text);
  if (!raw || typeof raw !== "object") return [];

  const o = raw as Record<string, unknown>;
  const list = Array.isArray(o.participants)
    ? o.participants
    : Array.isArray(o.travelers)
      ? o.travelers
      : Array.isArray(o.rows)
        ? o.rows
        : Array.isArray(raw)
          ? raw
          : [];

  const seen = new Set<string>();
  const out: ParticipantImportRow[] = [];
  for (const item of list) {
    const row = normalizeRow(item);
    if (!row) continue;
    const key = row.email ?? row.display_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out.slice(0, 80);
}

export async function extractParticipantsWithAi(
  sourceText: string,
  fileName?: string
): Promise<{ participants: ParticipantImportRow[]; usage: TripAiUsage }> {
  const prompt = [
    "Extrae la lista de viajeros/participantes del texto siguiente.",
    "Devuelve SOLO JSON válido con esta forma:",
    '{ "participants": [ { "display_name": "string", "email": "string|null", "phone": "string|null" } ] }',
    "Reglas:",
    "- display_name es obligatorio (nombre visible).",
    "- email y phone solo si aparecen; si no, null.",
    "- No inventes datos que no estén en el texto.",
    "- Máximo 80 personas. Sin duplicados.",
    fileName ? `Archivo: ${fileName}` : "",
    "",
    "TEXTO:",
    sourceText.slice(0, 14000),
  ]
    .filter(Boolean)
    .join("\n");

  const { text, usage } = await askTripAIWithUsage(prompt, "planning", {
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
  });

  return {
    participants: parseParticipantsFromAiJson(text),
    usage,
  };
}
