import * as XLSX from "xlsx";
import type { ParticipantImportRow } from "@/lib/participants/participantImportTypes";

const NAME_HEADERS = new Set([
  "nombre",
  "name",
  "display_name",
  "displayname",
  "participante",
  "viajero",
  "pasajero",
  "pasajeros",
  "full_name",
  "fullname",
  "nom",
  "apellidos",
  "nombre completo",
  "nombre y apellidos",
]);

const EMAIL_HEADERS = new Set(["email", "correo", "e-mail", "mail", "correo electronico", "correo electrónico"]);

const PHONE_HEADERS = new Set([
  "phone",
  "telefono",
  "teléfono",
  "movil",
  "móvil",
  "whatsapp",
  "tlf",
  "tel",
  "mobile",
  "celular",
  "telefono movil",
]);

function normalizeHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function normalizeEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
}

function normalizePhone(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const digits = v.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 8) return null;
  return v;
}

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function detectDelimiter(line: string): "," | ";" | "\t" {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  const tabs = (line.match(/\t/g) ?? []).length;
  if (tabs >= semicolons && tabs >= commas && tabs > 0) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

/** Parsea CSV/TSV con detección de separador (Excel europeo suele usar `;`). */
export function parseDelimitedParticipantText(text: string): string[][] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const delimiter = detectDelimiter(lines[0]!);
  const rows: string[][] = [];

  for (const line of lines) {
    if (delimiter === "\t") {
      rows.push(line.split("\t").map((c) => c.trim()));
      continue;
    }
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && ch === delimiter) {
        cells.push(current.trim());
        current = "";
        continue;
      }
      current += ch;
    }
    cells.push(current.trim());
    rows.push(cells);
  }

  return rows;
}

export function spreadsheetBufferToRows(buffer: Buffer): string[][] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as string[][];
  return raw
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((c) => c.length > 0));
}

function findColumnIndex(headers: string[], candidates: Set<string>): number {
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeHeader(headers[i] ?? "");
    if (candidates.has(h)) return i;
  }
  return -1;
}

function inferColumnsFromHeaders(headerRow: string[]): {
  nameIdx: number;
  emailIdx: number;
  phoneIdx: number;
} {
  const headers = headerRow.map((h) => normalizeHeader(h));
  let nameIdx = findColumnIndex(headers, NAME_HEADERS);
  let emailIdx = findColumnIndex(headers, EMAIL_HEADERS);
  let phoneIdx = findColumnIndex(headers, PHONE_HEADERS);

  if (nameIdx < 0 && headers.length >= 1) nameIdx = 0;
  if (emailIdx < 0 && headers.length >= 2) emailIdx = 1;
  if (phoneIdx < 0 && headers.length >= 3) phoneIdx = 2;

  return { nameIdx, emailIdx, phoneIdx };
}

function rowLooksLikeHeader(row: string[]): boolean {
  const joined = row.map((c) => normalizeHeader(c)).join(" ");
  return (
    NAME_HEADERS.has(normalizeHeader(row[0] ?? "")) ||
    EMAIL_HEADERS.has(normalizeHeader(row[0] ?? "")) ||
    /nombre|name|email|correo|telefono|teléfono|phone/i.test(joined)
  );
}

function rowToParticipant(
  row: string[],
  cols: { nameIdx: number; emailIdx: number; phoneIdx: number }
): ParticipantImportRow | null {
  const nameRaw = cols.nameIdx >= 0 ? row[cols.nameIdx] ?? "" : row[0] ?? "";
  const display_name = normalizeName(nameRaw);
  if (!display_name || display_name.length < 2) return null;

  const email =
    cols.emailIdx >= 0 ? normalizeEmail(row[cols.emailIdx] ?? "") : normalizeEmail(row[1] ?? "");
  const phone =
    cols.phoneIdx >= 0 ? normalizePhone(row[cols.phoneIdx] ?? "") : normalizePhone(row[2] ?? "");

  return { display_name, email, phone };
}

export function rowsToParticipantImports(matrix: string[][]): ParticipantImportRow[] {
  if (!matrix.length) return [];

  let start = 0;
  let cols = { nameIdx: 0, emailIdx: 1, phoneIdx: 2 };

  if (rowLooksLikeHeader(matrix[0]!)) {
    cols = inferColumnsFromHeaders(matrix[0]!);
    start = 1;
  } else if (matrix[0]!.length === 1) {
    return [];
  }

  const out: ParticipantImportRow[] = [];
  const seen = new Set<string>();

  for (let i = start; i < matrix.length; i++) {
    const row = matrix[i]!;
    const parsed = rowToParticipant(row, cols);
    if (!parsed) continue;
    const key = parsed.email ?? parsed.display_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(parsed);
  }

  return out;
}

export function parseDelimitedTextToParticipants(text: string): ParticipantImportRow[] {
  return rowsToParticipantImports(parseDelimitedParticipantText(text));
}

export function parseSpreadsheetToParticipants(buffer: Buffer): ParticipantImportRow[] {
  return rowsToParticipantImports(spreadsheetBufferToRows(buffer));
}

/** Lista simple «Nombre, email, tel» línea a línea sin cabecera. */
export function parsePlainLinesToParticipants(text: string): ParticipantImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const matrix = lines.map((line) => {
    if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
    if (line.includes(";")) return line.split(";").map((c) => c.trim());
    if (line.includes(",")) return line.split(",").map((c) => c.trim());
    const emailMatch = line.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    const phoneMatch = line.match(/(\+?\d[\d\s().-]{7,}\d)/);
    const email = emailMatch?.[0] ?? "";
    const phone = phoneMatch?.[0] ?? "";
    let name = line;
    if (email) name = name.replace(email, "");
    if (phone) name = name.replace(phone, "");
    name = name.replace(/[-–—|]/g, " ").trim();
    return [name, email, phone].map((c) => c.trim());
  });
  return rowsToParticipantImports(matrix);
}

export function parseParticipantListFromText(text: string): ParticipantImportRow[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const delimited = parseDelimitedTextToParticipants(trimmed);
  if (delimited.length >= 2) return delimited;

  const plain = parsePlainLinesToParticipants(trimmed);
  if (plain.length >= 1) return plain;

  return delimited;
}
