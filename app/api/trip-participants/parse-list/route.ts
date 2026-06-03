import { NextResponse } from "next/server";
import { extractTextFromFileBuffer } from "@/lib/trip-resources/extract-resource-text";
import { extractParticipantsWithAi } from "@/lib/participants/extractParticipantsWithAi";
import {
  parseParticipantListFromText,
  parseSpreadsheetToParticipants,
} from "@/lib/participants/parseParticipantList";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { requireTripAccessApi, forbidUnlessCanManageParticipants } from "@/lib/trip-access-api";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_ROWS = 80;

function isSpreadsheetName(name: string): boolean {
  return /\.(xlsx|xls|csv|tsv|txt)$/i.test(name);
}

function isImageOrPdf(name: string, mime: string): boolean {
  if (mime.startsWith("image/") || mime.includes("pdf")) return true;
  return /\.(png|jpe?g|webp|gif|pdf)$/i.test(name);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let tripId = "";
    let pastedText = "";
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tripId = typeof formData.get("tripId") === "string" ? String(formData.get("tripId")).trim() : "";
      pastedText =
        typeof formData.get("text") === "string" ? String(formData.get("text")).trim() : "";
      const f = formData.get("file");
      file = f instanceof File ? f : null;
    } else {
      const body = await request.json().catch(() => null);
      tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
      pastedText = typeof body?.text === "string" ? body.text.trim() : "";
    }

    if (!tripId) {
      return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const denied = forbidUnlessCanManageParticipants(gate.access);
    if (denied) return denied;

    if (!file && !pastedText) {
      return NextResponse.json(
        { error: "Sube un archivo o pega la lista de participantes." },
        { status: 400 }
      );
    }

    const monthKey = monthKeyUtc();
    let source: "csv" | "xlsx" | "text" | "ai" = "text";
    let participants: ReturnType<typeof parseParticipantListFromText> = [];
    let usage = null;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "";
      const fileName = file.name || "";

      if (/\.(xlsx|xls)$/i.test(fileName)) {
        participants = parseSpreadsheetToParticipants(buffer).slice(0, MAX_ROWS);
        source = "xlsx";
      } else if (/\.(csv|tsv|txt)$/i.test(fileName) || mimeType.includes("csv") || mimeType.includes("text")) {
        const text = buffer.toString("utf8");
        participants = parseParticipantListFromText(text).slice(0, MAX_ROWS);
        source = "csv";
      } else if (isImageOrPdf(fileName, mimeType)) {
        const extracted = (await extractTextFromFileBuffer(buffer, mimeType, fileName)).trim();
        if (extracted.length < 40) {
          return NextResponse.json(
            {
              error:
                "No se leyó suficiente texto de la imagen o PDF. Prueba una foto más nítida o exporta la lista como CSV/Excel.",
            },
            { status: 422 }
          );
        }
        const structured = parseParticipantListFromText(extracted);
        if (structured.length >= 2) {
          participants = structured.slice(0, MAX_ROWS);
          source = "text";
        } else {
          const budget = await enforceAiMonthlyBudgetOrThrow({ providerId: null, tripId });
          if (budget.userId !== gate.access.userId) {
            return NextResponse.json({ error: "No autenticado." }, { status: 401 });
          }
          const ai = await extractParticipantsWithAi(extracted, fileName);
          participants = ai.participants.slice(0, MAX_ROWS);
          usage = ai.usage;
          source = "ai";
          await trackAiUsage({
            supabase: budget.supabase,
            userId: budget.userId,
            provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
            monthKey,
            usage: ai.usage,
          });
        }
      } else if (isSpreadsheetName(fileName)) {
        participants = parseParticipantListFromText(buffer.toString("utf8")).slice(0, MAX_ROWS);
        source = "csv";
      } else {
        return NextResponse.json(
          {
            error:
              "Formato no soportado. Usa Excel (.xlsx), CSV o una imagen/PDF con la lista legible.",
          },
          { status: 400 }
        );
      }
    } else {
      participants = parseParticipantListFromText(pastedText).slice(0, MAX_ROWS);
      if (participants.length < 2 && pastedText.length > 80) {
        const budget = await enforceAiMonthlyBudgetOrThrow({ providerId: null, tripId });
        const ai = await extractParticipantsWithAi(pastedText);
        if (ai.participants.length > participants.length) {
          participants = ai.participants.slice(0, MAX_ROWS);
          source = "ai";
          usage = ai.usage;
          await trackAiUsage({
            supabase: budget.supabase,
            userId: budget.userId,
            provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
            monthKey,
            usage: ai.usage,
          });
        }
      }
    }

    if (!participants.length) {
      return NextResponse.json(
        {
          error:
            "No se detectaron participantes. Usa columnas Nombre, Email y Teléfono, o una fila por persona.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      source,
      participants,
      usage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo leer la lista de participantes.",
      },
      { status: 500 }
    );
  }
}
