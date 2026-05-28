import { NextResponse } from "next/server";
import { buildTripSummaryForAi } from "@/lib/trip-ai/buildTripSummary";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { extractItineraryFromAnswer } from "@/lib/trip-ai/extractItineraryFromAnswer";
import {
  TRIPBOARD_ITINERARY_JSON_END,
  TRIPBOARD_ITINERARY_JSON_START,
} from "@/lib/trip-ai/tripboardJsonMarkers";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : "";
    const sourceText = typeof body?.sourceText === "string" ? body.sourceText.trim() : "";
    const assistantHint = typeof body?.assistantHint === "string" ? body.assistantHint.trim() : "";

    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    if (!sourceText || sourceText.length < 80) {
      return NextResponse.json({ error: "Texto de itinerario demasiado corto." }, { status: 400 });
    }

    const monthKey = monthKeyUtc();
    let supabase: Awaited<ReturnType<typeof enforceAiMonthlyBudgetOrThrow>>["supabase"];
    let userId = "";
    try {
      const res = await enforceAiMonthlyBudgetOrThrow({ providerId: null });
      supabase = res.supabase;
      userId = res.userId;
    } catch (e) {
      const err = e as { httpStatus?: number; message?: string; code?: string };
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "No autenticado.", code: err?.code || null },
        { status: typeof err?.httpStatus === "number" ? err.httpStatus : 401 }
      );
    }

    const { data: participant } = await supabase
      .from("trip_participants")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .neq("status", "removed")
      .maybeSingle();
    if (!participant) return NextResponse.json({ error: "Sin acceso al viaje." }, { status: 403 });

    const isPremium = await isPremiumEnabledForTrip({ supabase, userId, tripId });
    if (!isPremium) {
      return NextResponse.json({ error: "Premium requerido.", code: "PREMIUM_REQUIRED" }, { status: 402 });
    }

    const tripSummary = await buildTripSummaryForAi(tripId);

    const prompt = [
      "Eres un extractor de itinerarios (protocolo TripBoard). Tu ÚNICA salida útil es JSON ejecutable entre marcadores.",
      "NO escribas markdown de días, listas con ### ni párrafos largos antes del JSON.",
      "Primero, SIN markdown, el bloque completo (usa exactamente estos marcadores, no KAVIRO_*):",
      TRIPBOARD_ITINERARY_JSON_START,
      "{",
      '  "version": 1,',
      '  "title": "string",',
      '  "days": [{ "day": 1, "date": "YYYY-MM-DD|null", "items": [{',
      '    "title": "string",',
      '    "activity_kind": "visit|museum|restaurant|transport|activity|lodging",',
      '    "place_name": "string|null",',
      '    "address": "string|null",',
      '    "latitude": number|null,',
      '    "longitude": number|null,',
      '    "start_time": "HH:MM|null",',
      '    "requires_ticket": boolean|null,',
      '    "ticket_notes": "string|null",',
      '    "notes": "string|null"',
      "  }] }]",
      "}",
      TRIPBOARD_ITINERARY_JSON_END,
      "Después del cierre del JSON, UNA línea humana (máx. 120 caracteres): «Listo: N actividades en M días para validar.»",
      "",
      "Reglas:",
      "- Extrae TODAS las actividades con hora del texto (vuelos, hotel, museos, partidos NBA/NFL/NHL, cruceros, comidas en sitio nombrado).",
      "- 12.00h → 12:00. Dirección postal en address; nombre del lugar en place_name con ciudad y país.",
      "- requires_ticket true en museos, torres, partidos, cruceros pagos; false en paseos libres o traslados.",
      "- Mapea «DÍA X» a fechas del CONTEXTO DEL VIAJE cuando existan.",
      "- No omitas días con actividades; un item por bloque horario concreto.",
      "",
      "CONTEXTO DEL VIAJE:",
      tripSummary,
      assistantHint ? `\nResumen previo del asistente (referencia):\n${assistantHint.slice(0, 2000)}` : "",
      "",
      "TEXTO A IMPORTAR:",
      sourceText.slice(0, 28000),
    ].join("\n");

    const { text: answer, usage } = await askTripAIWithUsage(prompt, "planning", {
      maxOutputTokens: 8192,
    });

    await trackAiUsage({
      supabase,
      userId,
      provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
      monthKey,
      usage,
    });

    const itinerary = extractItineraryFromAnswer(answer);
    if (!itinerary) {
      return NextResponse.json(
        {
          error:
            "No se pudo estructurar el itinerario. Prueba de nuevo o acorta el texto por tramos de días.",
          answer,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ ok: true, itinerary, answer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo importar el itinerario." },
      { status: 500 }
    );
  }
}
