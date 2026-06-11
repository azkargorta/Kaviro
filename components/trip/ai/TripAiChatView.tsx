"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import TripModuleIntro from "@/components/trip/ui/TripModuleIntro";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  FileText,
  MessageCircle,
  Route,
  Search,
  Settings,
  Sparkles,
  Wallet,
  Wand2,
} from "lucide-react";
import type { TripAiMode } from "@/lib/trip-ai/buildPrompt";
import { useTripData } from "@/hooks/useTripData";
import { useTripActivities } from "@/hooks/useTripActivities";
import { useTripAiOnboarding, type OnboardingDraft } from "@/components/trip/ai/useTripAiOnboarding";
import type { AIActionId } from "@/lib/trip-ai/aiActions";
import type { TripAssistantSurface } from "@/lib/trip-assistant-context";
import { parseTravelDocsChecklistFromAnswer } from "@/lib/trip-ai/travelDocsChecklist";
import TravelDocsChecklistCard from "@/components/trip/ai/TravelDocsChecklistCard";
import {
  enrichTravelSearchOffers,
  parseTravelSearchOffersFromAnswer,
  SEARCH_JSON_END,
  SEARCH_JSON_START,
} from "@/lib/trip-ai/travelSearchOffers";
import TravelSearchOffersCard from "@/components/trip/ai/TravelSearchOffersCard";
import TripAiItineraryReviewPanel from "@/components/trip/ai/TripAiItineraryReviewPanel";
import { dispatchTripPlanRefresh } from "@/lib/trip-plan-events";
import { dispatchTripOnboardingRefresh } from "@/lib/trip-onboarding";
import TripAiDocumentImportBar from "@/components/trip/ai/TripAiDocumentImportBar";
import PlanImportCardsStatusBanner, {
  PlanImportReadingBanner,
  type PlanImportCardsStatus,
} from "@/components/trip/plan/PlanImportCardsStatusBanner";
import { btnPrimary } from "@/components/ui/brandStyles";
import { useToast } from "@/components/ui/toast";
import PremiumUpsell from "@/components/premium/PremiumUpsell";
import { newChatMessageId, normalizeChatMessage } from "@/lib/chat-message-utils";
import {
  collectItineraryItemKeys,
  countDaySectionsInSource,
  countItineraryItems,
  filterItineraryBySelection,
  isItineraryImportIncomplete,
  isItineraryImportSufficient,
  buildItineraryImportSource,
  looksLikeAssistantItineraryText,
  looksLikePastedItineraryImport,
  prepareItineraryTextForImport,
  type ItineraryDraftPayload,
} from "@/lib/trip-ai/itineraryDraftUtils";
import {
  chunkItineraryByDays,
  shouldFastExecuteItinerary,
} from "@/lib/trip-ai/planExecuteStrategy";
import {
  alignItineraryDatesForImport,
  isAgencyCalendarParseAcceptable,
  looksLikeAgencyWeekdayCalendar,
  dedupeItineraryDays,
  mergeImportedItineraries,
  normalizeAgencyCalendarSourceText,
  orderItineraryDaysBySourceSections,
  pickChunkedOrFullItinerary,
  prepareDocumentTextForItineraryImport,
  parseAgencyCalendarItinerary,
  sanitizeItineraryBySourceSections,
  splitSourceForImport,
  supplementItineraryFromSourceSections,
} from "@/lib/trip-ai/importItineraryFromText";
import {
  buildItineraryPayloadFromSectionSchedule,
  tripDayCount,
} from "@/lib/trip-ai/agencyCalendarParse";

import { extractItineraryFromAnswer } from "@/lib/trip-ai/extractItineraryFromAnswer";
import {
  findItineraryJsonEnd,
  findItineraryJsonStart,
  stripAllKaviroJsonBlocksForDisplay,
} from "@/lib/trip-ai/kaviroJsonMarkers";
import { fetchJsonWithTimeout } from "@/lib/trip-ai/fetchJsonWithTimeout";
import {
  extractDiff,
  tryExtractMissingCoords,
  tryExtractRoutesDraft,
  type DiffPayload,
  type MissingCoordsItem,
} from "@/lib/trip-ai/chatResponseExtractors";
import type { RoutesDraftPayload } from "@/lib/trip-ai/routesDraftTypes";
import { diffOpDisplay, diffOpKey, type DiffOpDisplay } from "@/lib/trip-ai/diffDisplay";
import type { TripAiDiffOperation } from "@/lib/trip-ai/diff-types";
import {
  ASSISTANT_FOCUS_PRESETS,
  assistantContextPreset,
  buildInitialWelcomeMessages,
  coerceTripAiMode,
  DEFAULT_PAGE_WELCOME,
  getManualModeWelcome,
  MODE_LABELS,
  MODE_OPTIONS,
  OPENING_TRAVEL_DOCS,
  PLACEHOLDERS,
  type Conversation,
  type Message,
  type TripAiChatLayout,
} from "@/components/trip/ai/tripAiModeConfig";

const IMPORT_FULL_TIMEOUT_MS = 300_000;
const IMPORT_CHUNK_TIMEOUT_MS = 180_000;
/** Tramos en paralelo (2) para acortar «Generar tarjetas» sin saturar la IA. */
const IMPORT_CHUNK_CONCURRENCY = 2;
const EXECUTE_DAY_TIMEOUT_MS = 240_000;
const EXECUTE_BULK_TIMEOUT_MS = 120_000;

function useMobileViewport(maxWidthPx = 767) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [maxWidthPx]);
  return isMobile;
}

type ItineraryPayload = ItineraryDraftPayload;

function answerHasTruncatedItineraryJson(answer: string): boolean {
  const start = findItineraryJsonStart(answer);
  if (!start) return false;
  const end = findItineraryJsonEnd(answer, start.index + start.marker.length);
  return !end;
}

export default function TripAiChatView({
  tripId,
  isPremium = true,
  layout = "page",
  assistantContext = null,
  autoBootstrapItinerary = false,
  launchIntent = null,
  defaultAssistantMode = null,
  initialPrompt = null,
  initialPromptMode = null,
  planImportOnly = false,
}: {
  tripId: string;
  isPremium?: boolean;
  /** `drawer`: panel compacto sin cabecera de página ni columna de conversaciones. */
  layout?: TripAiChatLayout;
  /** Si viene del panel contextual, fija modo y mensaje inicial acorde a la pestaña. */
  assistantContext?: TripAssistantSurface | null;
  /**
   * Tras crear viaje con `?recien=1`: si el servidor detectó plan vacío + destino o fechas inicio/fin,
   * se lanza una sola vez «Sugerir itinerario» equivalente (opción C conservadora).
   */
  autoBootstrapItinerary?: boolean;
  /** Atajos desde el dashboard: envía un primer mensaje y limpia la URL al terminar bien. */
  launchIntent?: "optimize" | "auto_plans" | null;
  /** Desde `?modo=…` en la URL (p. ej. planificador al crear viaje). Ignorado si hay `assistantContext` en drawer. */
  defaultAssistantMode?: TripAiMode | null;
  /** Mensaje de usuario enviado automáticamente al montar (p. ej. sugerencia «IA sugiere» en Plan). */
  initialPrompt?: string | null;
  /** Modo forzado al enviar `initialPrompt` (p. ej. `actions` para parches del plan). */
  initialPromptMode?: TripAiMode | null;
  /** Solo importación de dossier + revisión de tarjetas (Plan Kaviro Trips). */
  planImportOnly?: boolean;
}) {
  const ctxPreset = assistantContext ? assistantContextPreset(assistantContext) : null;
  const isMobileViewport = useMobileViewport();
  const isMobileDrawer = layout === "drawer" && isMobileViewport;
  const isMobilePage = layout === "page" && isMobileViewport;
  const isMobileChatCompact = isMobileDrawer || isMobilePage;
  const router = useRouter();
  const pathname = usePathname();

  const [mode, setMode] = useState<TripAiMode>(() => ctxPreset?.mode ?? defaultAssistantMode ?? "general");
  const [provider, setProvider] = useState<"auto" | "gemini" | "ollama">("auto");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() =>
    buildInitialWelcomeMessages({
      layout,
      ctxPreset,
      defaultAssistantMode: ctxPreset ? null : defaultAssistantMode ?? null,
    })
  );
  const [question, setQuestion] = useState(() => initialPrompt?.trim() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [aiBudgetExceeded, setAiBudgetExceeded] = useState(false);
  const [itineraryDraft, setItineraryDraft] = useState<ItineraryPayload | null>(null);
  /** En drawer: itinerario a pantalla completa (oculta chat) hasta «Volver al chat». */
  const [itineraryFullscreenReview, setItineraryFullscreenReview] = useState(true);
  const [itinerarySelected, setItinerarySelected] = useState<Set<string>>(new Set());
  const [importingItineraryCards, setImportingItineraryCards] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    label: string;
  } | null>(null);
  const [importCardsFailed, setImportCardsFailed] = useState(false);
  const [importCardsStatus, setImportCardsStatus] = useState<PlanImportCardsStatus | null>(null);
  const [importReadingLabel, setImportReadingLabel] = useState<string | null>(null);
  const [diffDraft, setDiffDraft] = useState<DiffPayload | null>(null);
  const [routesDraft, setRoutesDraft] = useState<RoutesDraftPayload | null>(null);
  const [missingCoords, setMissingCoords] = useState<MissingCoordsItem[] | null>(null);
  const [applyingDiff, setApplyingDiff] = useState(false);
  const [diffContext, setDiffContext] = useState<{
    activitiesById: Map<string, any>;
    routesById: Map<string, any>;
  } | null>(null);
  const [diffContextLoading, setDiffContextLoading] = useState(false);
  const [diffAllowDeletes, setDiffAllowDeletes] = useState(false);
  const [diffSelected, setDiffSelected] = useState<Set<string>>(new Set());
  const [executingPlan, setExecutingPlan] = useState(false);
  const [executeProgress, setExecuteProgress] = useState<{
    current: number;
    total: number;
    activitiesCreated: number;
  } | null>(null);
  const [planConflictOpen, setPlanConflictOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [itineraryActivityIndex, setItineraryActivityIndex] = useState(0);
  const dayStripRef = useRef<HTMLDivElement | null>(null);
  const lastImportSourceRef = useRef<string | null>(null);
  const [dayStripEdges, setDayStripEdges] = useState({ left: false, right: false });
  const [modeSource, setModeSource] = useState<"auto" | "manual">(() =>
    ctxPreset?.modeSource ?? (defaultAssistantMode ? "manual" : "auto")
  );
  /** En panel por pestaña (`drawer`), el selector de modo va recogido por defecto. */
  const [modePickerOpen, setModePickerOpen] = useState(layout !== "drawer" && layout !== "page");
  const [planActivityCount, setPlanActivityCount] = useState<number | null>(null);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const initialPromptAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/ai-budget/status?tripId=${encodeURIComponent(tripId)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data && typeof data?.exceeded === "boolean") {
          setAiBudgetExceeded(Boolean(data.exceeded));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const { trip, participants, reload: reloadTrip, loading: tripDataLoading } = useTripData(tripId);

  const searchTripDefaults = useMemo(() => {
    const dest = typeof trip?.destination === "string" && trip.destination.trim() ? trip.destination.trim() : "";
    const start =
      typeof trip?.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(trip.start_date) ? trip.start_date : "";
    const end =
      typeof trip?.end_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(trip.end_date) ? trip.end_date : start;
    const adults = Math.max(1, participants?.length || 2);
    if (!dest && !start) return undefined;
    return { destination: dest || "Destino del viaje", startDate: start, endDate: end, adults };
  }, [trip?.destination, trip?.start_date, trip?.end_date, participants?.length]);
  const { activities: tripPlanActivities, reload: reloadTripPlanActivities } =
    useTripActivities(tripId, undefined, { subscribeRealtime: false });
  const toast = useToast();

  const hasAnyPlans = useMemo(() => (tripPlanActivities?.length || 0) > 0, [tripPlanActivities]);
  const hasAnyLodging = useMemo(() => {
    return (tripPlanActivities || []).some((a: any) => String(a?.activity_kind || "").toLowerCase() === "lodging");
  }, [tripPlanActivities]);

  const itineraryItemTotal = useMemo(
    () => (itineraryDraft ? countItineraryItems(itineraryDraft) : 0),
    [itineraryDraft]
  );

  const itinerarySelectedCount = itinerarySelected.size;

  const itineraryDayNav = useMemo(() => {
    if (!itineraryDraft || expandedDay == null) {
      return {
        dayIndex: -1,
        day: null as ItineraryDraftPayload["days"][number] | null,
        activityCount: 0,
        safeActivityIndex: 0,
      };
    }
    const dayIndex = itineraryDraft.days.findIndex((d) => d.day === expandedDay);
    const day = dayIndex >= 0 ? itineraryDraft.days[dayIndex]! : null;
    const activityCount = day?.items?.length ?? 0;
    const safeActivityIndex =
      activityCount > 0 ? Math.min(Math.max(0, itineraryActivityIndex), activityCount - 1) : 0;
    return { dayIndex, day, activityCount, safeActivityIndex };
  }, [itineraryDraft, expandedDay, itineraryActivityIndex]);

  const lastPastedItinerarySource = useMemo(() => {
    if (lastImportSourceRef.current) return lastImportSourceRef.current;
    let lastUser: string | null = null;
    let lastAssistant: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.id === "welcome") continue;
      if (m.role === "assistant" && !lastAssistant && looksLikeAssistantItineraryText(m.content)) {
        lastAssistant = m.content;
      }
      if (m.role === "user" && !lastUser && looksLikePastedItineraryImport(m.content)) {
        lastUser = m.content;
      }
      if (lastUser && lastAssistant) break;
    }
    if (lastUser || lastAssistant) {
      return buildItineraryImportSource(lastUser ?? "", lastAssistant ?? "");
    }
    return null;
  }, [messages]);

  const itineraryConflictDates = useMemo(() => {
    if (!itineraryDraft || itinerarySelected.size === 0) return [];
    const filtered = filterItineraryBySelection(itineraryDraft, itinerarySelected);
    const draftDates = new Set<string>();
    for (const day of filtered.days) {
      const d = day.date;
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) draftDates.add(d);
    }
    if (!draftDates.size) return [];
    const used = new Set<string>();
    for (const a of tripPlanActivities) {
      const ad = a.activity_date;
      if (typeof ad === "string" && draftDates.has(ad)) used.add(ad);
    }
    return Array.from(used).sort();
  }, [itineraryDraft, itinerarySelected, tripPlanActivities]);

  const runExecutePlan = useCallback(
    async (conflictResolution: "add" | "replace") => {
      const draft = itineraryDraft;
      if (!draft) return;
      const filtered = filterItineraryBySelection(draft, itinerarySelected);
      if (countItineraryItems(filtered) === 0) {
        setError("Marca al menos una actividad para añadirla al plan.");
        return;
      }
      setExecutingPlan(true);
      setExecuteProgress(null);
      setInfo(null);
      setError(null);
      setPlanConflictOpen(false);

      const fastMode = shouldFastExecuteItinerary(filtered);
      const chunks = fastMode ? [filtered] : chunkItineraryByDays(filtered, 3);
      const totalItems = countItineraryItems(filtered);
      let totalCreated = 0;
      let totalRoutes = 0;
      let routesNote = "";
      const focusDate =
        filtered.days.find((d) => typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date))?.date ??
        undefined;

      const clearImportUi = () => {
        setItineraryFullscreenReview(false);
        setItineraryDraft(null);
        setItinerarySelected(new Set());
        setExpandedDay(null);
      };

      try {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]!;
          const chunkItems = countItineraryItems(chunk);
          setExecuteProgress({
            current: i + 1,
            total: chunks.length,
            activitiesCreated: totalCreated,
          });
          setInfo(
            fastMode
              ? `Añadiendo ${totalItems} actividades al plan…`
              : chunks.length > 1
                ? `Añadiendo al plan: bloque ${i + 1} de ${chunks.length}…`
                : "Añadiendo actividades al plan…"
          );

          const { res, payload } = await fetchJsonWithTimeout(
            "/api/trip-ai/execute-plan",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                tripId,
                itinerary: chunk,
                conflictResolution: i === 0 ? conflictResolution : "add",
                generateRoutes: false,
                skipGeocoding: fastMode,
              }),
            },
            fastMode ? EXECUTE_BULK_TIMEOUT_MS : EXECUTE_DAY_TIMEOUT_MS
          );
          if (!res.ok) {
            throw new Error(
              typeof payload?.error === "string" ? payload.error : "No se pudo ejecutar el plan."
            );
          }

          const nAct = typeof payload?.created === "number" ? payload.created : 0;
          totalCreated += nAct;
          const nRoutes = typeof payload?.routesCreated === "number" ? payload.routesCreated : 0;
          totalRoutes += nRoutes;
          if (typeof payload?.routesNote === "string" && payload.routesNote.trim()) {
            routesNote = payload.routesNote;
          }

          if (i === 0) {
            clearImportUi();
          }

          dispatchTripPlanRefresh(tripId, {
            closeAssistant: layout === "drawer" && i === 0,
            plansAdded: nAct,
            focusDate,
            message:
              chunks.length > 1 && i + 1 < chunks.length
                ? `${totalCreated} de ~${totalItems} actividades ya en Plan…`
                : undefined,
          });
        }

        const actMsg =
          totalCreated === 1 ? "1 plan añadido al viaje" : `${totalCreated} planes añadidos al viaje`;
        const routeMsg = totalRoutes > 0 ? ` · ${totalRoutes} ruta${totalRoutes === 1 ? "" : "s"} en el mapa` : "";
        const fastHint = fastMode
          ? " Ubicaciones del mapa se pueden completar después desde cada actividad."
          : "";
        const successMessage = [routesNote, `${actMsg}${routeMsg}.${fastHint}`].filter(Boolean).join(" ");
        toast.success("Planes añadidos", successMessage.trim());
        setInfo(successMessage.trim());
        dispatchTripPlanRefresh(tripId, {
          closeAssistant: layout === "drawer",
          plansAdded: totalCreated,
          focusDate,
          message: successMessage.trim(),
        });
        dispatchTripOnboardingRefresh(tripId);
        router.refresh();
        void reloadTripPlanActivities();
      } catch (e) {
        const raw = e instanceof Error ? e.message : "No se pudo ejecutar el plan.";
        const isAbort = e instanceof Error && e.name === "AbortError";
        const partial =
          totalCreated > 0
            ? ` Ya se guardaron ${totalCreated} actividades; recarga Plan y continúa solo con lo que falte.`
            : "";
        if (totalCreated > 0) {
          dispatchTripPlanRefresh(tripId, { plansAdded: totalCreated, focusDate });
        }
        if (isAbort || /fetch failed|failed to fetch|networkerror|aborted|timeout/i.test(raw)) {
          setError(
            `No se pudo completar la ejecución (red o tiempo de espera).${partial}`
          );
        } else {
          setError(raw + partial);
        }
      } finally {
        setExecutingPlan(false);
        setExecuteProgress(null);
      }
    },
    [itineraryDraft, itinerarySelected, tripId, layout, reloadTripPlanActivities, router, toast]
  );

  const runImportItineraryCards = useCallback(
    async (sourceText: string, assistantHint?: string): Promise<ItineraryPayload | null> => {
      const text = prepareDocumentTextForItineraryImport(
        prepareItineraryTextForImport(sourceText)
      );
      if (!text || importingItineraryCards) return null;
      lastImportSourceRef.current = text;
      setImportReadingLabel(null);
      setImportingItineraryCards(true);
      setImportProgress(null);
      setImportCardsFailed(false);
      setImportCardsStatus({
        phase: "generating",
        current: 0,
        total: 1,
        label: "Preparando el itinerario…",
      });
      setError(null);
      const isAgencyCalendar = looksLikeAgencyWeekdayCalendar(text);
      const tripSummaryForImport =
        trip?.start_date && trip?.end_date
          ? `Viaje: ${trip?.name || "Viaje"} | Fechas: ${trip.start_date} → ${trip.end_date}`
          : "";
      const sections = splitSourceForImport(text, tripSummaryForImport || undefined);
      const useClientChunks = sections.length >= 2 || text.length > 1200;
      const detectedDays = countDaySectionsInSource(text);
      const dayCountPrefix =
        detectedDays >= 2
          ? `IMPORTANTE: el dossier tiene ${detectedDays} días de calendario. Genera exactamente ${detectedDays} tarjetas/días en el mismo orden.\n\n`
          : "";
      const hint = `${dayCountPrefix}${assistantHint?.slice(0, 6000) ?? ""}`;

      const tripDays =
        trip?.start_date && trip?.end_date ? tripDayCount(trip.start_date, trip.end_date) : 0;
      const sectionCount = sections.filter((s) => s.header !== "Todo").length;
      const expectedSectionDays =
        tripDays >= 2 ? Math.max(tripDays, sectionCount) : Math.max(detectedDays, sectionCount);

      const finalizeImportDraft = (draft: ItineraryPayload): ItineraryPayload => {
        const deduped = dedupeItineraryDays(draft);
        if (!tripSummaryForImport) return deduped;
        let out = alignItineraryDatesForImport(deduped, tripSummaryForImport, text);
        out = supplementItineraryFromSourceSections(out, text, tripSummaryForImport);
        out = orderItineraryDaysBySourceSections(out, text, tripSummaryForImport);
        return sanitizeItineraryBySourceSections(out, text, tripSummaryForImport);
      };

      let sectionResults: Array<ItineraryPayload | null> = [];

      const finishImportSuccess = (draft: ItineraryPayload, infoLine?: string) => {
        const days = draft.days.length;
        const activities = countItineraryItems(draft);
        setImportCardsStatus({ phase: "ready", days, activities });
        setInfo(
          infoLine ??
            `Tarjetas listas (${days} día${days !== 1 ? "s" : ""}, ${activities} actividad${activities !== 1 ? "es" : ""}). Revisa y pulsa «Añadir seleccionadas».`
        );
        return draft;
      };

      try {
        let agencyQuickDraft: ItineraryPayload | null = null;
        if (tripSummaryForImport && isAgencyCalendar) {
          const fast = parseAgencyCalendarItinerary(text, tripSummaryForImport);
          if (fast) {
            agencyQuickDraft = finalizeImportDraft(fast);
            const minDays =
              tripDays >= 2
                ? Math.max(2, Math.ceil(tripDays * 0.95))
                : Math.max(2, Math.floor(expectedSectionDays * 0.88));
            if (
              isAgencyCalendarParseAcceptable(agencyQuickDraft, text, tripSummaryForImport) &&
              agencyQuickDraft.days.length >= minDays
            ) {
              return finishImportSuccess(agencyQuickDraft);
            }
          }
        }

        if (useClientChunks) {
          const activeSections = sections.filter((s) => s.body.trim());
          const total = activeSections.length;
          let completed = 0;
          setImportCardsStatus({
            phase: "generating",
            current: 0,
            total: Math.max(1, total),
            label: total > 1 ? `Procesando ${total} tramos del dossier…` : "Generando tarjetas del itinerario…",
          });

          const importOneSection = async (
            section: { header: string; body: string },
            sectionIndex: number
          ) => {
            const { res, payload } = await fetchJsonWithTimeout(
              "/api/trip-ai/import-itinerary",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  tripId,
                  sourceText: section.body,
                  singleChunk: true,
                  chunkLabel: section.header,
                  fullSourceText: text,
                  chunkSectionIndex: sectionIndex,
                  chunkSectionTotal: total,
                }),
              },
              IMPORT_CHUNK_TIMEOUT_MS
            );
            if (res.ok && payload?.itinerary) {
              return payload.itinerary as ItineraryPayload;
            }
            if (!tripSummaryForImport) return null;
            return (
              buildItineraryPayloadFromSectionSchedule(
                section,
                tripSummaryForImport,
                text,
                sectionIndex,
                total
              ) as ItineraryPayload | null
            );
          };

          const orderedPartsFromSections = () =>
            sectionResults.filter((p): p is ItineraryPayload => p != null);

          const flushPartial = () => {
            const parts = orderedPartsFromSections();
            if (!parts.length) return;
            const partial = tripSummaryForImport
              ? finalizeImportDraft(mergeImportedItineraries(parts))
              : mergeImportedItineraries(parts);
            setItineraryDraft(partial);
            setItinerarySelected(collectItineraryItemKeys(partial));
            if (expandedDay == null && partial.days[0]) {
              setExpandedDay(partial.days[0]!.day);
            }
            setImportCardsStatus((prev) =>
              prev?.phase === "generating"
                ? {
                    ...prev,
                    partialDays: partial.days.length,
                    partialActivities: countItineraryItems(partial),
                  }
                : prev
            );
          };

          sectionResults = new Array(total).fill(null);

          for (let i = 0; i < activeSections.length; i += IMPORT_CHUNK_CONCURRENCY) {
            const batch = activeSections.slice(i, i + IMPORT_CHUNK_CONCURRENCY);
            const batchEnd = Math.min(completed + batch.length, total);
            const batchLabel = batch.map((s) => s.header).join(" · ");
            setImportProgress({ current: completed + 1, total, label: batchLabel });
            setImportCardsStatus((prev) =>
              prev?.phase === "generating"
                ? {
                    ...prev,
                    current: completed + 1,
                    total,
                    label: batchLabel || `Tramos ${completed + 1}–${batchEnd} de ${total}`,
                  }
                : {
                    phase: "generating",
                    current: completed + 1,
                    total,
                    label: batchLabel,
                  }
            );
            setInfo(`Generando tarjetas: tramos ${completed + 1}–${batchEnd} de ${total}…`);
            const chunkResults = await Promise.all(
              batch.map((section, batchOffset) => importOneSection(section, i + batchOffset))
            );
            chunkResults.forEach((part, batchIdx) => {
              const globalIdx = i + batchIdx;
              sectionResults[globalIdx] = part;
            });
            completed += batch.length;
            setImportProgress({ current: completed, total, label: batch[batch.length - 1]!.header });
            setImportCardsStatus((prev) =>
              prev?.phase === "generating"
                ? { ...prev, current: completed, total, label: batch[batch.length - 1]!.header }
                : prev
            );
            flushPartial();
          }

          const missingCount = sectionResults.filter((p) => !p).length;
          if (missingCount > 0) {
            setInfo(`Reintentando ${missingCount} tramo(s) que no se generaron…`);
            for (let idx = 0; idx < activeSections.length; idx++) {
              if (sectionResults[idx]) continue;
              const part = await importOneSection(activeSections[idx]!, idx);
              if (part) sectionResults[idx] = part;
            }
            flushPartial();
          }

          const orderedParts = orderedPartsFromSections();
          let mergedDraft = orderedParts.length ? mergeImportedItineraries(orderedParts) : null;
          if (mergedDraft && tripSummaryForImport) {
            mergedDraft = finalizeImportDraft(mergedDraft);
          }

          if (
            mergedDraft &&
            expectedSectionDays >= 2 &&
            mergedDraft.days.length >= expectedSectionDays
          ) {
            return finishImportSuccess(mergedDraft);
          }

          if (mergedDraft && isItineraryImportSufficient(mergedDraft, text)) {
            return finishImportSuccess(mergedDraft);
          }

          const needsMoreDays =
            tripDays >= 2
              ? !mergedDraft || mergedDraft.days.length < tripDays
              : !mergedDraft ||
                mergedDraft.days.length < Math.max(2, Math.floor(expectedSectionDays * 0.9));

          if (!needsMoreDays && mergedDraft) {
            return finishImportSuccess(mergedDraft);
          }

          setInfo("Completando días que falten…");
          setImportCardsStatus((prev) =>
            prev?.phase === "generating"
              ? { ...prev, label: "Completando días que falten en el dossier…" }
              : prev
          );
          const { res: fullRes, payload: fullPayload } = await fetchJsonWithTimeout(
            "/api/trip-ai/import-itinerary",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ tripId, sourceText: text, assistantHint: hint }),
            },
            IMPORT_FULL_TIMEOUT_MS
          );
          if (fullRes.ok && fullPayload?.itinerary) {
            const fullDraft = finalizeImportDraft(fullPayload.itinerary as ItineraryPayload);
            mergedDraft = pickChunkedOrFullItinerary(
              mergedDraft,
              fullDraft,
              text,
              expectedSectionDays
            );
          }

          if (mergedDraft && agencyQuickDraft) {
            mergedDraft = finalizeImportDraft(
              pickChunkedOrFullItinerary(agencyQuickDraft, mergedDraft, text, expectedSectionDays)
            );
          } else if (!mergedDraft && agencyQuickDraft) {
            mergedDraft = agencyQuickDraft;
          }

          if (mergedDraft) {
            return finishImportSuccess(mergedDraft);
          }

          setImportCardsFailed(true);
          setInfo(null);
          const apiErr = typeof fullPayload?.error === "string" ? fullPayload.error : null;
          const failMsg =
            apiErr ||
            "No se pudieron generar las tarjetas. Pulsa «Generar tarjetas» o pega solo 2–3 días a la vez.";
          setImportCardsStatus({ phase: "failed", message: failMsg });
          setError(failMsg);
          return null;
        }

        setInfo("Generando tarjetas para validar el itinerario…");
        setImportCardsStatus({
          phase: "generating",
          current: 0,
          total: 1,
          label: "Generando tarjetas del itinerario…",
        });
        const { res, payload } = await fetchJsonWithTimeout(
          "/api/trip-ai/import-itinerary",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ tripId, sourceText: text, assistantHint: hint }),
          },
          IMPORT_FULL_TIMEOUT_MS
        );
        if (!res.ok || !payload?.itinerary) {
          setImportCardsFailed(true);
          setInfo(null);
          const failMsg =
            typeof payload?.error === "string" ? payload.error : "No se pudieron generar las tarjetas.";
          setImportCardsStatus({ phase: "failed", message: failMsg });
          setError(failMsg);
          return null;
        }
        const draft = finalizeImportDraft(payload.itinerary as ItineraryPayload);
        return finishImportSuccess(draft);
      } catch (e) {
        setImportCardsFailed(true);
        setInfo(null);
        const isAbort = e instanceof Error && e.name === "AbortError";
        const partialDraft = sectionResults.some((p) => p != null)
          ? tripSummaryForImport
            ? finalizeImportDraft(
                mergeImportedItineraries(
                  sectionResults.filter((p): p is ItineraryPayload => p != null)
                )
              )
            : mergeImportedItineraries(
                sectionResults.filter((p): p is ItineraryPayload => p != null)
              )
          : null;
        const partialCount = partialDraft ? countItineraryItems(partialDraft) : 0;
        const partialHint =
          partialCount > 0
            ? ` Ya hay ${partialCount} actividades en las tarjetas; puedes revisarlas o volver a generar para el resto.`
            : "";
        const errMsg = isAbort
          ? `Tiempo de espera al generar tarjetas.${partialHint}`
          : `Error de red al generar las tarjetas.${partialHint}`;
        if (partialDraft) {
          setError(errMsg);
          return finishImportSuccess(
            partialDraft,
            `Tarjetas parciales (${partialDraft.days.length} días). Revisa lo generado o vuelve a intentar el resto.`
          );
        }
        setImportCardsStatus({ phase: "failed", message: errMsg });
        setError(errMsg);
        return null;
      } finally {
        setImportingItineraryCards(false);
        setImportProgress(null);
      }
    },
    [importingItineraryCards, tripId, expandedDay, trip?.start_date, trip?.end_date, trip?.name]
  );

  const syncDayStripEdges = useCallback(() => {
    const el = dayStripRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 2) {
      setDayStripEdges({ left: false, right: false });
      return;
    }
    setDayStripEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < maxScroll - 4,
    });
  }, []);

  const scrollDayStrip = useCallback((dir: "left" | "right") => {
    const el = dayStripRef.current;
    if (!el) return;
    const step = Math.max(200, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!itineraryDraft) {
      setDayStripEdges({ left: false, right: false });
      return;
    }
    const el = dayStripRef.current;
    if (!el) return;
    const onScroll = () => syncDayStripEdges();
    const ro = new ResizeObserver(() => syncDayStripEdges());
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(() => syncDayStripEdges());
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [itineraryDraft, itineraryDraft?.days?.length, syncDayStripEdges]);

  useEffect(() => {
    setItineraryActivityIndex(0);
  }, [expandedDay]);

  useEffect(() => {
    if (!itineraryDraft?.days?.length) return;
    if (expandedDay == null) {
      setExpandedDay(itineraryDraft.days[0]!.day);
    }
  }, [itineraryDraft, expandedDay]);

  const reviewingItineraryDraft = Boolean(itineraryDraft);
  const showImportStatusGlobally = Boolean(
    importCardsStatus &&
      !(planImportOnly && reviewingItineraryDraft && importCardsStatus.phase === "ready")
  );
  const itineraryFillsDrawer =
    reviewingItineraryDraft && layout === "drawer" && itineraryFullscreenReview && !isMobileViewport;
  const hideChatForItineraryCards = itineraryFillsDrawer;

  useEffect(() => {
    if (reviewingItineraryDraft && layout === "drawer") {
      setModePickerOpen(false);
    }
  }, [reviewingItineraryDraft, layout]);

  const hadItineraryDraftRef = useRef(false);
  useEffect(() => {
    const hasDraft = Boolean(itineraryDraft);
    if (hasDraft && !hadItineraryDraftRef.current && layout === "drawer" && !isMobileViewport) {
      setItineraryFullscreenReview(true);
    }
    if (!hasDraft) setItineraryFullscreenReview(true);
    hadItineraryDraftRef.current = hasDraft;
  }, [itineraryDraft, layout, isMobileViewport]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/trip-activities?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        const n = Array.isArray(data?.activities) ? data.activities.length : 0;
        if (!cancelled) setPlanActivityCount(n);
      } catch {
        if (!cancelled) setPlanActivityCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const {
    onboardingActive,
    onboardingDraft,
    setOnboardingDraft,
    skipOnboarding,
    markOnboardingComplete,
  } = useTripAiOnboarding({
    tripId,
    tripLoaded: !tripDataLoading && planActivityCount !== null && Boolean(trip),
    planActivityCount,
  });

  const beginNewChatForMode = useCallback(
    (next: TripAiMode | "auto", opts?: { onlyIfChanged?: boolean }) => {
      if (opts?.onlyIfChanged) {
        if (next === "auto" && modeSource === "auto") return;
        if (next !== "auto" && modeSource === "manual" && mode === next) return;
      }

      setConversationId(null);
      setItineraryDraft(null);
      setItinerarySelected(new Set());
      setPlanConflictOpen(false);
      setDiffDraft(null);
      setRoutesDraft(null);
      setMissingCoords(null);
      setDiffContext(null);
      setDiffContextLoading(false);
      setDiffSelected(new Set());
      setDiffAllowDeletes(false);
      setApplyingDiff(false);
      setExpandedDay(null);
      setQuestion("");
      setInfo(null);
      setError(null);

      if (next === "auto") {
        if (layout === "drawer" && ctxPreset?.welcome) {
          setModeSource(ctxPreset.modeSource);
          setMode(ctxPreset.mode);
          setMessages([
            {
              id: newChatMessageId(),
              role: "assistant",
              content: ctxPreset.welcome,
            },
          ]);
        } else {
          setModeSource("auto");
          setMode("general");
          setMessages([
            {
              id: newChatMessageId(),
              role: "assistant",
              content: DEFAULT_PAGE_WELCOME,
            },
          ]);
        }
        return;
      }

      if (onboardingActive) skipOnboarding();

      setModeSource("manual");
      setMode(next);
      setMessages([
        {
          id: newChatMessageId(),
          role: "assistant",
          content: getManualModeWelcome(next),
        },
      ]);
    },
    [ctxPreset, layout, mode, modeSource, onboardingActive, skipOnboarding]
  );

  const patchTripMeta = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar el viaje.");
      await reloadTrip();
    },
    [tripId, reloadTrip]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadDiffContext() {
      if (!diffDraft) {
        setDiffContext(null);
        return;
      }
      setDiffContextLoading(true);
      try {
        const [aRes, rRes] = await Promise.all([
          fetch(`/api/trip-activities?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" }),
          fetch(`/api/trip-routes?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" }),
        ]);
        const [aPayload, rPayload] = await Promise.all([
          aRes.json().catch(() => null),
          rRes.json().catch(() => null),
        ]);
        const activities = Array.isArray(aPayload?.activities) ? aPayload.activities : [];
        const routes = Array.isArray(rPayload?.routes) ? rPayload.routes : [];
        const activitiesById = new Map<string, any>();
        const routesById = new Map<string, any>();
        for (const row of activities) if (row?.id) activitiesById.set(String(row.id), row);
        for (const row of routes) if (row?.id) routesById.set(String(row.id), row);
        if (!cancelled) setDiffContext({ activitiesById, routesById });
      } catch {
        if (!cancelled) setDiffContext(null);
      } finally {
        if (!cancelled) setDiffContextLoading(false);
      }
    }
    void loadDiffContext();
    return () => {
      cancelled = true;
    };
  }, [diffDraft, tripId]);

  useEffect(() => {
    // Selección por defecto: todo menos borrados
    if (!diffDraft) {
      setDiffSelected(new Set());
      setDiffAllowDeletes(false);
      return;
    }
    const next = new Set<string>();
    (diffDraft.operations || []).forEach((op: any, idx: number) => {
      const key = diffOpKey(op as TripAiDiffOperation, idx);
      const rawOp = typeof op?.op === "string" ? op.op.toLowerCase() : "";
      if (rawOp.startsWith("delete_")) return;
      if (
        !["update_activity", "create_activity", "delete_activity", "update_route", "create_route"].includes(rawOp)
      ) {
        return;
      }
      next.add(key);
    });
    setDiffSelected(next);
    setDiffAllowDeletes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffDraft]);

  const diffDisplayCtx = useMemo(
    () => ({
      activitiesById: diffContext?.activitiesById,
      routesById: diffContext?.routesById,
    }),
    [diffContext]
  );

  const placeholder = useMemo(() => PLACEHOLDERS[mode], [mode]);

  const activeMode = useMemo(() => MODE_OPTIONS.find((m) => m.id === mode), [mode]);
  const focusModeSummary = useMemo(() => {
    if (modeSource === "auto") return "Automático";
    const preset = ASSISTANT_FOCUS_PRESETS.find((p) => p.id === mode);
    return preset?.label ?? MODE_LABELS[mode] ?? mode;
  }, [mode, modeSource]);

  function collapseModePickerIfDrawer() {
    if (layout === "drawer" || isMobilePage) setModePickerOpen(false);
  }

  useEffect(() => {
    if (isMobilePage) setModePickerOpen(false);
  }, [isMobilePage]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("trip_ai_provider");
      if (stored === "gemini" || stored === "ollama" || stored === "auto") setProvider(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("trip_ai_provider", provider);
    } catch {
      // ignore
    }
  }, [provider]);

  useEffect(() => {
    if (isPremium) void loadConversations();
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversations() {
    const res = await fetch(`/api/trip-ai/conversations?tripId=${encodeURIComponent(tripId)}`);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      const raw = Array.isArray(data?.conversations) ? data.conversations : [];
      setConversations(
        raw.map((c: Conversation) => ({
          ...c,
          mode: coerceTripAiMode((c as Conversation).mode),
        }))
      );
    }
  }

  async function openConversation(id: string) {
    if (!isPremium) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trip-ai/${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "No se pudo abrir la conversación.");
      setConversationId(id);
      const rows = Array.isArray(data?.messages) ? data.messages : [];
      const normalized: Message[] = [];
      for (const row of rows) {
        const m = normalizeChatMessage(row);
        if (m) normalized.push(m);
      }
      setMessages(
        normalized.length
          ? normalized
          : buildInitialWelcomeMessages({
              layout,
              ctxPreset,
              defaultAssistantMode: ctxPreset ? null : defaultAssistantMode ?? null,
            })
      );
      if (data?.conversation?.mode) setMode(coerceTripAiMode(data.conversation.mode));
      setInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la conversación.");
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setConversationId(null);
    if (layout === "drawer" && ctxPreset) {
      setModeSource(ctxPreset.modeSource);
      setMode(ctxPreset.mode);
      setMessages([
        {
          id: newChatMessageId(),
          role: "assistant",
          content: ctxPreset.welcome,
        },
      ]);
    } else {
      const def = defaultAssistantMode ?? null;
      setModeSource(def ? "manual" : "auto");
      setMode(def ?? "general");
      setMessages([
        {
          id: newChatMessageId(),
          role: "assistant",
          content: buildInitialWelcomeMessages({ layout, ctxPreset: null, defaultAssistantMode: def })[0]?.content ?? DEFAULT_PAGE_WELCOME,
        },
      ]);
    }
    setQuestion("");
    setInfo(null);
    setError(null);
  }

  async function sendMessage(
    customQuestion?: string,
    forcedAiAction?: AIActionId | null,
    hooks?: { onSuccess?: () => void; onError?: () => void },
    sendOptions?: { mode?: TripAiMode; modeSource?: "auto" | "manual" }
  ) {
    if (!isPremium) return;
    if (aiBudgetExceeded) {
      setError("Has alcanzado el límite mensual de IA. El asistente se reactivará el mes que viene.");
      hooks?.onError?.();
      return;
    }
    const clean = (customQuestion ?? question).trim();
    if (!clean || loading) return;

    const effectiveMode = sendOptions?.mode ?? mode;
    const effectiveModeSource = sendOptions?.modeSource ?? modeSource;
    if (sendOptions?.mode) {
      setMode(sendOptions.mode);
      setModeSource(sendOptions.modeSource ?? "manual");
      setModePickerOpen(false);
    }

    const priorForHint = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => m.id !== "welcome")
      .slice(-4);
    const dialogHint =
      [
        ...priorForHint.map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content.slice(0, 420)}`),
        `Usuario: ${clean.slice(0, 420)}`,
      ]
        .join("\n")
        .slice(0, 900) || "";

    if (looksLikePastedItineraryImport(clean)) {
      lastImportSourceRef.current = clean;
    }
    setMessages((current) => [...current, { id: newChatMessageId(), role: "user", content: clean }]);
    setQuestion("");
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const endpoint = effectiveMode === "day_planner" ? "/api/trip-ai/organize-day" : "/api/trip-ai/chat";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          effectiveMode === "day_planner"
            ? {
                tripId,
                question: clean,
                provider: provider === "auto" ? null : provider,
                conversation: [
                  ...messages
                    .filter((m) => m.role === "user" || m.role === "assistant")
                    .filter((m) => m.id !== "welcome")
                    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
                  { role: "user" as const, content: clean },
                ].slice(-8),
              }
            : {
                tripId,
                question: clean,
                mode: effectiveMode,
                modeSource: effectiveModeSource,
                conversationId,
                provider: provider === "auto" ? null : provider,
                dialogHint,
                ...(forcedAiAction ? { aiAction: forcedAiAction } : {}),
              }
        ),
      });

      const rawText = await res.text();
      let data: Record<string, unknown> | null = null;
      try {
        data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
      } catch {
        data = null;
      }
      if (!res.ok) {
        const fromJson = typeof data?.error === "string" ? data.error : "";
        const fallback = rawText.trim().slice(0, 800);
        const code = typeof (data as any)?.code === "string" ? String((data as any).code) : "";
        if (code === "AI_BUDGET_EXCEEDED") {
          setAiBudgetExceeded(true);
          throw new Error(fromJson || "Has alcanzado el límite mensual de IA. Vuelve a intentarlo el mes que viene.");
        }
        throw new Error(fromJson || fallback || "No se pudo obtener respuesta.");
      }

      if (!data) {
        throw new Error("Respuesta vacía del servidor.");
      }

      if (effectiveMode !== "day_planner") {
        const nextConv =
          typeof data.conversationId === "string" && data.conversationId
            ? data.conversationId
            : conversationId;
        setConversationId(nextConv);
      }
      setMessages((current) => [
        ...current,
        {
          id: newChatMessageId(),
          role: "assistant",
          content: typeof data.answer === "string" ? data.answer : "No se pudo generar respuesta",
        },
      ]);
      setAiBudgetExceeded(false);

      const hasDayPlannerDiff =
        effectiveMode === "day_planner" &&
        data?.diff &&
        (data.diff as { version?: number }).version === 1 &&
        Array.isArray((data.diff as { operations?: unknown }).operations);

      if (hasDayPlannerDiff) {
        setItineraryDraft(null);
        setItinerarySelected(new Set());
        setExpandedDay(null);
        setDiffDraft(data.diff as DiffPayload);
        setRoutesDraft(tryExtractRoutesDraft(data));
        setMissingCoords(tryExtractMissingCoords(data));
      } else {
        const answerStr = typeof data.answer === "string" ? data.answer : "";
        let maybe = answerStr ? extractItineraryFromAnswer(answerStr) : null;
        setImportCardsFailed(false);

        const importSource = buildItineraryImportSource(clean, answerStr);
        const shouldRunImport =
          looksLikeAssistantItineraryText(importSource) ||
          answerHasTruncatedItineraryJson(answerStr) ||
          (maybe != null && isItineraryImportIncomplete(maybe, importSource));

        let imported: ItineraryPayload | null = null;
        if (shouldRunImport) {
          lastImportSourceRef.current = importSource;
          imported = await runImportItineraryCards(importSource, answerStr);
          if (imported) {
            const preferImport =
              !maybe || countItineraryItems(imported) > countItineraryItems(maybe);
            if (preferImport) maybe = imported;
          }
        }

        if (maybe) {
          setItineraryDraft(maybe);
          setItinerarySelected(collectItineraryItemKeys(maybe));
          setExpandedDay(maybe.days[0]?.day ?? null);
          setImportCardsFailed(false);
        } else if (shouldRunImport && !imported) {
          setImportCardsFailed(true);
        }

        const maybeDiff = answerStr ? extractDiff(answerStr) : null;
        if (maybeDiff) setDiffDraft(maybeDiff);
        setRoutesDraft(null);
        setMissingCoords(null);
      }

      if (data?.actionExecuted && data?.actionResult) {
        setInfo(String(data.actionResult));
      }

      if (effectiveMode === "day_planner" && typeof data?.dayPlannerHint === "string" && data.dayPlannerHint) {
        setInfo(String(data.dayPlannerHint));
      }

      await loadConversations();
      if (onboardingActive) markOnboardingComplete();
      hooks?.onSuccess?.();
    } catch (err) {
      hooks?.onError?.();
      const detail = err instanceof Error ? err.message : "No se pudo obtener respuesta.";
      setError(detail);
      const timeoutLike = /FUNCTION_INVOCATION_TIMEOUT|\b504\b|Gateway Timeout|timed out/i.test(detail);
      const timeoutHint = timeoutLike
        ? "\n\nSi ves timeout de despliegue: el servidor cortó la petición por tiempo. Espera un momento y reintenta; si tu plan Vercel limita la duración de funciones, puede hacer falta subir de plan. También puedes pedir un ritmo más relajado (menos paradas por día) en la misma petición."
        : "";
      setMessages((current) => [
        ...current,
        {
          id: newChatMessageId(),
          role: "assistant",
          content:
            "No pude completar la respuesta del servidor.\n\n" +
            `Detalle: ${detail}\n\n` +
            "Si habla de cuota o API (Gemini), espera un poco o revisa GEMINI_API_KEY. Si el mensaje era muy largo, prueba una petición más corta." +
            timeoutHint,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function finalizeOnboardingWithAi(override?: Partial<OnboardingDraft>) {
    if (!isPremium || onboardingBusy) return;
    const merged = { ...onboardingDraft, ...override };
    setOnboardingDraft(merged);
    setOnboardingBusy(true);
    setError(null);
    try {
      const dest = (merged.destination || trip?.destination || trip?.name || "").trim();
      if (!dest) {
        setError("Indica un destino (en el chat o en el nombre/resumen del viaje) para generar el plan.");
        return;
      }
      await patchTripMeta({
        destination: dest || null,
        start_date: merged.startDate || trip?.start_date || null,
        end_date: merged.endDate || trip?.end_date || null,
      });

      const datePart =
        merged.startDate && merged.endDate
          ? `Fechas: ${merged.startDate} → ${merged.endDate}.`
          : merged.dateNotes
            ? `Fechas (texto del usuario): ${merged.dateNotes}.`
            : "Fechas: propón un calendario coherente si faltan datos exactos.";

      const prompt = [
        `Genera un itinerario completo para todos los días del viaje y devuelve un único bloque JSON según el modo planificación (sin omitir días salvo que el usuario haya pedido solo un tramo).`,
        `Destino principal: ${dest}.`,
        datePart,
        merged.partySize ? `Personas aprox.: ${merged.partySize}.` : "",
        merged.tripStyle ? `Tipo de viaje: ${merged.tripStyle}.` : "",
        `Incluye 2–4 paradas por día cuando tenga sentido, con ritmo equilibrado; en viajes largos puedes bajar a 2–3 por día para cubrir todo el periodo sin repetir visitas.`,
      ]
        .filter(Boolean)
        .join(" ");

      await sendMessage(prompt, "generate_trip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la guía inicial.");
    } finally {
      setOnboardingBusy(false);
    }
  }

  function defaultFiveDayWindow(): { startDate: string; endDate: string } {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 21);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 4);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  }

  async function quickBootstrapPlan(pickedDestination?: string) {
    if (!isPremium || onboardingBusy) return;
    const dest = (pickedDestination || trip?.destination?.trim() || trip?.name?.trim() || "").trim();
    if (!dest) {
      setError(
        "Falta un destino: escríbelo en el chat (ej. «Oporto 4 días») o edita nombre/destino del viaje en el resumen."
      );
      return;
    }
    let startDate = trip?.start_date ?? null;
    let endDate = trip?.end_date ?? null;
    if (!startDate || !endDate || startDate > endDate) {
      const w = defaultFiveDayWindow();
      startDate = w.startDate;
      endDate = w.endDate;
    }
    await finalizeOnboardingWithAi({
      destination: dest,
      startDate,
      endDate,
      partySize: 2,
      tripStyle: "Mixto",
      dateNotes: null,
    });
  }

  const autoBootstrapOnceRef = useRef(false);
  useEffect(() => {
    if (!autoBootstrapItinerary || layout !== "page") return;
    if (!trip || tripDataLoading) return;
    if (planActivityCount === null || planActivityCount > 0) return;
    if (loading || onboardingBusy) return;

    let allow = false;
    try {
      const key = `kaviro_ai_autoboot_itin:${tripId}`;
      if (typeof window !== "undefined" && window.sessionStorage.getItem(key) === "1") return;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, "1");
      }
      allow = true;
    } catch {
      if (autoBootstrapOnceRef.current) return;
      autoBootstrapOnceRef.current = true;
      allow = true;
    }
    if (!allow) return;

    void quickBootstrapPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- una sola vez al cumplir condiciones; quickBootstrapPlan es estable en intención
  }, [
    autoBootstrapItinerary,
    layout,
    trip,
    tripDataLoading,
    planActivityCount,
    loading,
    onboardingBusy,
    tripId,
  ]);

  useEffect(() => {
    if (!launchIntent || layout !== "page" || !isPremium) return;
    if (!trip || tripDataLoading) return;
    if (loading || onboardingBusy) return;

    const storageKey = `kaviro_dash_launch:${tripId}:${launchIntent}`;
    let timeoutId = 0;
    let cancelled = false;

    try {
      const st = typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null;
      if (st === "done" || st === "inflight") return;
      if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "inflight");
    } catch {
      /* ignore */
    }

    skipOnboarding();

    const run = () => {
      if (cancelled) return;
      if (launchIntent === "optimize") {
        void sendMessage("Optimiza el viaje: detecta huecos, solapes y mejoras prácticas.", "optimize_route", {
          onSuccess: () => {
            try {
              if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "done");
            } catch {
              /* ignore */
            }
            router.replace(pathname);
          },
          onError: () => {
            try {
              if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKey);
            } catch {
              /* ignore */
            }
          },
        }, { mode: "optimizer", modeSource: "manual" });
      } else {
        void sendMessage(
          "Completa el itinerario con propuestas concretas (visitas, comidas, desplazamientos) alineadas con destino, fechas y lo ya planificado. Si hay días vacíos o poco cubiertos, rellénalos; si casi no hay planes, propon un calendario por días ejecutable cuando aplique.",
          null,
          {
            onSuccess: () => {
              try {
                if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "done");
              } catch {
                /* ignore */
              }
              router.replace(pathname);
            },
            onError: () => {
              try {
                if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKey);
              } catch {
                /* ignore */
              }
            },
          },
          { mode: "planning", modeSource: "manual" }
        );
      }
    };

    timeoutId = window.setTimeout(run, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      try {
        if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey) === "inflight") {
          window.sessionStorage.removeItem(storageKey);
        }
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disparo único desde URL; sendMessage evoluciona cada render
  }, [
    launchIntent,
    layout,
    isPremium,
    trip,
    tripDataLoading,
    loading,
    onboardingBusy,
    tripId,
    pathname,
    router,
    skipOnboarding,
  ]);

  useEffect(() => {
    const clean = initialPrompt?.trim();
    if (!clean || !isPremium) return;
    if (initialPromptAppliedRef.current === clean) return;
    initialPromptAppliedRef.current = clean;

    setQuestion(clean);
    if (initialPromptMode) {
      setMode(initialPromptMode);
      setModeSource("manual");
      setModePickerOpen(false);
    }
    skipOnboarding();

    const focusId = window.setTimeout(() => {
      questionInputRef.current?.focus();
      const len = clean.length;
      questionInputRef.current?.setSelectionRange(len, len);
    }, 280);

    return () => window.clearTimeout(focusId);
  }, [initialPrompt, initialPromptMode, isPremium, skipOnboarding]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = question.trim();
    if (!clean || loading) return;
    void sendMessage();
  }

  const showPageHeader = layout === "page" && !planImportOnly;
  const showConvSidebar = layout === "page" && !planImportOnly;
  const Root = layout === "drawer" || planImportOnly ? "div" : "main";
  /** En drawer el panel tiene altura fija: columna flex + scroll solo en mensajes para que el envío quede visible. */
  const rootClass =
    planImportOnly
      ? "w-full min-w-0 max-w-full space-y-4 overflow-x-hidden"
      : layout === "drawer"
        ? isMobileDrawer
          ? "flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden"
          : "flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-3 overflow-x-hidden overflow-y-hidden"
        : "w-full min-w-0 max-w-full space-y-6 overflow-x-hidden";

  const chatComposerForm = (
    <form
      data-tour="ai-input"
      onSubmit={handleSubmit}
      className={`min-w-0 max-w-full border-t border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] ${
        isMobileChatCompact
          ? "shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
          : layout === "drawer"
            ? "shrink-0 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:p-5"
            : "p-4 sm:p-5"
      }`}
    >
      <div
        className={`min-w-0 max-w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors focus-within:ring-2 focus-within:ring-[var(--brand-border)] ${question.length > 0 ? "border-violet-300" : "border-slate-200"}`}
      >
        <textarea
          ref={questionInputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading && question.trim() && isPremium && !aiBudgetExceeded) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={isMobileChatCompact ? 3 : 4}
          placeholder={placeholder}
          disabled={!isPremium || aiBudgetExceeded}
          className={`w-full resize-none border-0 bg-transparent px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
            isMobileChatCompact ? "min-h-[72px]" : "min-h-[100px]"
          }`}
        />
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 dark:border-[#1E293B]">
          <div className="flex min-w-0 items-center gap-2">
            {!reviewingItineraryDraft ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                ✦ {activeMode?.label || "Asistente"}
              </span>
            ) : null}
            {question.length > 0 ? (
              <span className={`text-[10px] font-semibold ${question.length > 1800 ? "text-red-500" : "text-slate-400"}`}>
                {question.length}/2000
              </span>
            ) : (
              <span className="hidden text-[10px] text-slate-300 sm:inline">Intro para enviar · Shift+Intro para nueva línea</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {question.length > 0 ? (
              <button
                type="button"
                onClick={() => setQuestion("")}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300 dark:hover:bg-[#334155]"
              >
                ✕
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading || !question.trim() || !isPremium || aiBudgetExceeded}
              className="rounded-xl bg-[var(--brand)] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-[#1E293B]"
            >
              Enviar →
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  const showDocumentImport = isPremium && !aiBudgetExceeded;
  const documentImportSection = showDocumentImport ? (
    <TripAiDocumentImportBar
      tripId={tripId}
      disabled={loading || executingPlan}
      busy={importingItineraryCards}
      defaultExpanded={
        planImportOnly || mode === "planning" || layout === "drawer" || assistantContext === "plan"
      }
      onReadingPhase={(active, label) => setImportReadingLabel(active ? label ?? "Leyendo el documento…" : null)}
      onStatus={(msg) => {
        if (msg) setInfo(msg);
        if (msg?.includes("generando tarjetas")) {
          setImportCardsStatus({
            phase: "generating",
            current: 0,
            total: 1,
            label: msg,
          });
        }
      }}
      onGenerateFromText={async (sourceText, hint) => {
        const draft = await runImportItineraryCards(sourceText, hint);
        if (!draft) return null;
        setItineraryDraft(draft);
        setItinerarySelected(collectItineraryItemKeys(draft));
        setExpandedDay(draft.days[0]?.day ?? null);
        setItineraryFullscreenReview(true);
        return draft;
      }}
    />
  ) : null;

  if (!isPremium) {
    if (layout === "drawer") {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-[#1E293B] dark:bg-[#080C14] dark:text-slate-300">
          El asistente personal requiere Premium en este viaje.
        </div>
      );
    }
    return (
      <main className="space-y-6">
        <TripBoardPageHeader
          section="Asistente personal del viaje"
          title="Asistente personal"
          description="Requiere Premium en este viaje."
          iconKey="chat"
          iconAlt="Asistente personal"
          actions={<TripScreenActions tripId={tripId} />}
        />
        <PremiumUpsell
          feature="aiAssistant"
          className="rounded-3xl p-6"
          secondaryHref={`/trip/${encodeURIComponent(tripId)}/summary`}
          secondaryLabel="Volver al resumen"
        />
      </main>
    );
  }

  return (
    <Root className={rootClass}>
      <div
        className={
          isMobileDrawer
            ? "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
            : undefined
        }
      >
        <div
          className={
            isMobileDrawer
              ? "min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
              : undefined
          }
        >
      {showPageHeader ? (
        <TripBoardPageHeader
          section="Asistente personal del viaje"
          title="Asistente personal"
          description="Conversación libre con sugerencias y guía opcional al crear el plan. El asistente personal usa un resumen del viaje y acciones concretas (no todo el historial) para ahorrar tokens."
          iconKey="chat"
          iconAlt="Asistente personal"
          actions={<TripScreenActions tripId={tripId} />}
        />
      ) : null}

      {showPageHeader && !onboardingActive ? (
        <TripModuleIntro
          title="Tu copiloto de viaje"
          description="Pregunta, reorganiza o mejora el plan sin salir del viaje. Elige un atajo o escribe lo que necesites."
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
        >
          <div data-tour="ai-quick-prompts" className="mt-4 flex flex-wrap gap-2">
            {[
              "Mejorar itinerario",
              "Buscar plan para hoy",
              "Reorganizar día",
              "Sugerir restaurante",
              "Resolver duda del viaje",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading || aiBudgetExceeded || !isPremium}
                onClick={() => {
                  setQuestion(prompt);
                  void sendMessage(prompt);
                }}
                className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] shadow-sm transition hover:bg-[var(--brand-light)] disabled:opacity-50 dark:bg-[#0F1623] dark:hover:bg-[#141c2b]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </TripModuleIntro>
      ) : null}

      {onboardingActive ? (
        <section className="rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">Plan vacío</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Montemos el viaje sin formularios largos</p>
              <p className="mt-1 text-sm text-slate-600">
                Un clic genera un <span className="font-semibold text-slate-800">borrador de 5 días</span> (ritmo mixto, 2 personas) usando el destino del viaje; luego lo cambias todo por chat. O escribe abajo lo que quieras y seguimos desde ahí: la primera respuesta cierra este aviso.
              </p>
              {trip?.destination?.trim() || trip?.name?.trim() ? (
                <p className="mt-2 text-xs text-slate-500">
                  Destino detectado:{" "}
                  <span className="font-semibold text-slate-700">{trip?.destination?.trim() || trip?.name?.trim()}</span>
                  {trip?.start_date && trip?.end_date ? (
                    <>
                      {" "}
                      · fechas del viaje: {trip.start_date} → {trip.end_date}
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-800">
                  Aún no hay destino en el viaje: escribe en el chat (ej. «Oporto 4 días») o usa una ciudad de ejemplo.
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={onboardingBusy || loading}
                onClick={() => void quickBootstrapPlan()}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-50"
              >
                {onboardingBusy ? "Generando…" : "Sugerir itinerario"}
              </button>
              <button
                type="button"
                onClick={() => skipOnboarding()}
                disabled={onboardingBusy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                Prefiero solo chat
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Roma", "París", "Lisboa", "Oporto", "Tokio"].map((city) => (
              <button
                key={city}
                type="button"
                disabled={onboardingBusy || loading}
                onClick={() => void quickBootstrapPlan(city)}
                className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-light)] disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                {city}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {planConflictOpen && itineraryDraft ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-conflict-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#1E293B] dark:bg-[#0F1623]">
            <div id="plan-conflict-title" className="text-sm font-extrabold text-slate-950">
              Ya hay planes en el calendario
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Para{" "}
              {itineraryConflictDates.length === 1
                ? `el día ${itineraryConflictDates[0]}`
                : `estos días: ${itineraryConflictDates.join(", ")}`}{" "}
              ya tienes actividades en el plan. ¿Quieres sustituirlas por el nuevo itinerario o añadir las nuevas paradas
              a las que ya existen?
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                disabled={executingPlan}
                onClick={() => setPlanConflictOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={executingPlan}
                onClick={() => void runExecutePlan("add")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm transition hover:bg-[var(--brand-light)] disabled:opacity-60"
              >
                Añadir a lo existente
              </button>
              <button
                type="button"
                disabled={executingPlan}
                onClick={() => void runExecutePlan("replace")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                Sustituir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hideChatForItineraryCards && !planImportOnly ? documentImportSection : null}

      {importReadingLabel && !importingItineraryCards ? (
        <PlanImportReadingBanner label={importReadingLabel} />
      ) : null}

      {showImportStatusGlobally && importCardsStatus ? (
        <PlanImportCardsStatusBanner
          status={importCardsStatus}
          onDismissReady={
            importCardsStatus.phase === "ready" ? () => setImportCardsStatus(null) : undefined
          }
        />
      ) : null}

      {!itineraryDraft && (lastPastedItinerarySource || importCardsFailed) && !importingItineraryCards ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            {importCardsFailed
              ? "No se pudieron crear las tarjetas automáticamente."
              : "Si solo ves el itinerario en texto en el chat, genera las tarjetas para validar cada actividad."}
          </p>
          <button
            type="button"
            disabled={importingItineraryCards || loading}
            onClick={() => {
              const src = lastPastedItinerarySource ?? lastImportSourceRef.current;
              if (!src) return;
              void runImportItineraryCards(src).then((draft) => {
                if (!draft) return;
                setItineraryDraft(draft);
                setItinerarySelected(collectItineraryItemKeys(draft));
                setExpandedDay(draft.days[0]?.day ?? null);
              });
            }}
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
          >
            Generar tarjetas desde el texto
          </button>
        </section>
      ) : null}

      {itineraryDraft ? (
        <TripAiItineraryReviewPanel
          layout={layout}
          planImportOnly={planImportOnly}
          itineraryFillsDrawer={itineraryFillsDrawer}
          isMobileDrawer={isMobileDrawer}
          reviewingItineraryDraft={reviewingItineraryDraft}
          itineraryDraft={itineraryDraft}
          importCardsStatus={importCardsStatus}
          itinerarySelected={itinerarySelected}
          itinerarySelectedCount={itinerarySelectedCount}
          itineraryItemTotal={itineraryItemTotal}
          expandedDay={expandedDay}
          itineraryDayNav={itineraryDayNav}
          dayStripEdges={dayStripEdges}
          dayStripRef={dayStripRef}
          executingPlan={executingPlan}
          executeProgress={executeProgress}
          loading={loading}
          itineraryConflictDates={itineraryConflictDates}
          onFullscreenReviewChange={setItineraryFullscreenReview}
          onItinerarySelectedChange={setItinerarySelected}
          onExpandedDayChange={setExpandedDay}
          onActivityIndexReset={() => setItineraryActivityIndex(0)}
          onActivityIndexChange={setItineraryActivityIndex}
          onSetActivityIndex={setItineraryActivityIndex}
          onScrollDayStrip={scrollDayStrip}
          onExecuteAdd={() => void runExecutePlan("add")}
          onOpenConflict={() => setPlanConflictOpen(true)}
          onDiscard={() => {
            setItineraryDraft(null);
            setItinerarySelected(new Set());
            setExpandedDay(null);
            setItineraryActivityIndex(0);
          }}
          onDismissImportReady={() => setImportCardsStatus(null)}
        />
      ) : null}

      {diffDraft ? (
        <section
          className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] ${
            layout === "drawer"
              ? "flex min-h-0 max-h-[min(58dvh,560px)] shrink-0 flex-col overflow-hidden p-3 sm:p-4"
              : "flex max-h-[min(75vh,720px)] min-h-0 flex-col overflow-hidden p-4 sm:p-5 xl:max-h-[min(72vh,calc(100dvh-10rem))]"
          }`}
        >
          <div className="shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950">Cambios propuestos por el asistente personal</div>
              <div className="mt-1 text-xs text-slate-600">
                Revisa el “diff” antes de aplicar. Está agrupado por día y muestra antes → después cuando es posible.
              </div>
              {mode === "day_planner" ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  En <span className="font-semibold">Organizar día</span>, las actividades y las rutas se guardan con{" "}
                  <span className="font-semibold">Aplicar cambios</span> (no uses “Ejecutar plan”, que es solo para
                  itinerarios en JSON incrustados en el chat).
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDiffDraft(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Descartar
              </button>
              <button
                type="button"
                disabled={applyingDiff || diffSelected.size === 0}
                onClick={async () => {
                  setApplyingDiff(true);
                  setError(null);
                  try {
                    const filtered = (diffDraft.operations || []).filter((op: any, idx: number) =>
                      diffSelected.has(diffOpKey(op as TripAiDiffOperation, idx))
                    );
                    const res = await fetch("/api/trip-ai/apply-diff", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tripId, diff: { ...diffDraft, operations: filtered } }),
                    });
                    const payload = await res.json().catch(() => null);
                    if (!res.ok) throw new Error(payload?.error || "No se pudo aplicar el diff.");
                    if (payload?.results?.some?.((r: any) => !r.ok)) {
                      throw new Error("Se aplicaron algunos cambios, pero otros fallaron. Revisa el historial o vuelve a intentar.");
                    }

                    const appliedCount = filtered.length;
                    dispatchTripPlanRefresh(tripId, { closeAssistant: layout === "drawer" });
                    dispatchTripOnboardingRefresh(tripId);
                    router.refresh();
                    await reloadTripPlanActivities();
                    setDiffDraft(null);
                    setDiffContext(null);
                    setDiffSelected(new Set());
                    setDiffAllowDeletes(false);
                    setConversationId(null);
                    setQuestion("");
                    setInfo(null);
                    setMessages([
                      {
                        id: newChatMessageId(),
                        role: "assistant",
                        content:
                          appliedCount === 1
                            ? "Listo: he aplicado 1 cambio al plan. Puedes verlo en la pestaña Plan.\n\n¿Quieres que siga revisando el viaje?"
                            : `Listo: he aplicado ${appliedCount} cambios al plan. Puedes verlos en la pestaña Plan.\n\n¿Quieres que siga revisando el viaje?`,
                      },
                    ]);
                    window.requestAnimationFrame(() => {
                      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                    });
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo aplicar el diff.");
                  } finally {
                    setApplyingDiff(false);
                  }
                }}
                className="rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                {applyingDiff ? "Aplicando..." : "Aplicar cambios"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-600">
              Seleccionados: <span className="font-semibold text-slate-900">{diffSelected.size}</span> /{" "}
              <span className="font-semibold text-slate-900">{diffDraft.operations?.length || 0}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={diffAllowDeletes}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDiffAllowDeletes(checked);
                    if (!checked) {
                      // al desactivar, deseleccionamos cualquier delete_*
                      const next = new Set(diffSelected);
                      (diffDraft.operations || []).forEach((op: any, idx: number) => {
                        const rawOp = typeof op?.op === "string" ? op.op.toLowerCase() : "";
                        if (rawOp.startsWith("delete_")) next.delete(diffOpKey(op as TripAiDiffOperation, idx));
                      });
                      setDiffSelected(next);
                    }
                  }}
                />
                Permitir borrados
              </label>
              <button
                type="button"
                onClick={() => {
                  const next = new Set<string>();
                  (diffDraft.operations || []).forEach((op: any, idx: number) => {
                    const rawOp = typeof op?.op === "string" ? op.op.toLowerCase() : "";
                    if (rawOp.startsWith("delete_") && !diffAllowDeletes) return;
                    next.add(diffOpKey(op as TripAiDiffOperation, idx));
                  });
                  setDiffSelected(next);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Seleccionar todo
              </button>
              <button
                type="button"
                onClick={() => setDiffSelected(new Set())}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Deseleccionar todo
              </button>
            </div>
          </div>
          </div>

          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-color:rgba(148,163,184,0.55)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600/80 ${
              layout === "drawer" ? "mt-2 pr-1" : "mt-4 pr-0.5"
            }`}
            role="region"
            aria-label="Lista de cambios propuestos"
          >
          {diffContextLoading ? (
            <div className="text-sm text-slate-600">Preparando preview…</div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const ops = (diffDraft.operations || [])
                  .slice(0, 80)
                  .map((op, idx) => ({
                    ...diffOpDisplay(op as TripAiDiffOperation, diffDisplayCtx),
                    __key: diffOpKey(op as TripAiDiffOperation, idx),
                    __rawOp: op,
                    __idx: idx,
                  }));
                const byDate = new Map<string, DiffOpDisplay[]>();
                for (const item of ops) {
                  const key = item.date || "Sin fecha";
                  const arr = byDate.get(key) || [];
                  arr.push(item);
                  byDate.set(key, arr);
                }
                const dates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
                return (
                  <>
                    {dates.map((d) => (
                      <div key={d} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-950">{d}</div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                            {byDate.get(d)?.length || 0} cambios
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {(byDate.get(d) || []).map((it, idx) => {
                            const tone =
                              it.tone === "good"
                                ? "border-emerald-200 bg-white"
                                : it.tone === "warn"
                                  ? "border-rose-200 bg-white"
                                  : "border-slate-200 bg-white";
                            const badge =
                              it.tone === "good"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : it.tone === "warn"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200";
                            const badgeText =
                              it.kind === "unknown"
                                ? "Revisar"
                                : it.tone === "good"
                                  ? "Añade"
                                  : it.tone === "warn"
                                    ? "Borra"
                                    : "Cambia";
                            const rawOp = (it as any).__rawOp;
                            const rawOpName = typeof rawOp?.op === "string" ? rawOp.op.toLowerCase() : "";
                            const isDelete = rawOpName.startsWith("delete_");
                            const key = (it as any).__key as string;
                            const selected = diffSelected.has(key);
                            const disabled = isDelete && !diffAllowDeletes;
                            return (
                              <details
                                key={`${it.title}-${idx}`}
                                className={`rounded-xl border ${tone} p-3 ${disabled ? "opacity-60" : ""}`}
                              >
                                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      disabled={disabled}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setDiffSelected((prev) => {
                                          const next = new Set(prev);
                                          if (checked) next.add(key);
                                          else next.delete(key);
                                          return next;
                                        });
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1"
                                      title={
                                        disabled
                                          ? "Activa “Permitir borrados” para seleccionar esto."
                                          : "Aplicar este cambio"
                                      }
                                    />
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-slate-950">{it.title}</div>
                                      {it.subtitle ? (
                                        <div className="mt-1 text-xs text-slate-600">{it.subtitle}</div>
                                      ) : null}
                                      {it.details ? (
                                        <div className="mt-1 text-xs text-rose-700">{it.details}</div>
                                      ) : null}
                                    </div>
                                  </div>

                                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
                                    {badgeText}
                                  </span>
                                </summary>
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                                    Detalle técnico (JSON)
                                  </div>
                                  <pre className="mt-2 max-w-full overflow-x-auto break-all whitespace-pre-wrap text-xs text-slate-700">
{JSON.stringify(it.raw, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {(diffDraft.operations || []).length > 80 ? (
                      <div className="text-xs text-slate-500">… y más cambios (truncado).</div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          )}
          </div>
        </section>
      ) : null}

      {planImportOnly && !reviewingItineraryDraft ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)]/60 via-white to-slate-50 px-4 py-3 dark:from-[#1e3a5f]/15 dark:via-[#0F1623] dark:to-[#080C14]">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">
              Programa desde dossier
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sube el PDF o una foto del itinerario de la agencia. La IA extrae horarios, lugares, coordenadas cuando
              aparezcan y el tipo de cada actividad; luego revisas las tarjetas y las añades al plan.
            </p>
          </div>
          {importReadingLabel && !importingItineraryCards ? (
            <PlanImportReadingBanner label={importReadingLabel} />
          ) : null}
          {documentImportSection}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}
          {info && !importCardsStatus ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {info}
            </div>
          ) : null}
        </div>
      ) : null}

      {!planImportOnly && !hideChatForItineraryCards ? (
      <section
        className={
          showConvSidebar
            ? "grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]"
            : layout === "drawer"
              ? isMobileDrawer
                ? "flex shrink-0 flex-col gap-2 overflow-visible"
                : "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
              : "grid grid-cols-1 gap-3"
        }
      >
        {showConvSidebar ? (
        <aside data-tour="ai-history" className="order-2 space-y-5 xl:order-1 xl:space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">Conversaciones</h2>
              <button
                type="button"
                onClick={newConversation}
                disabled={!isPremium || aiBudgetExceeded}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Nueva
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {conversations.length ? conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openConversation(item.id)}
                  disabled={!isPremium || aiBudgetExceeded}
                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    conversationId === item.id
                      ? "border-violet-300 bg-violet-50 text-violet-900"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-semibold">{item.title || "Sin título"}</div>
                  <div className="mt-1 text-xs opacity-70">
                    {MODE_LABELS[item.mode as TripAiMode] || item.mode}
                  </div>
                </button>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Todavía no hay conversaciones guardadas.</p>
              )}
            </div>
          </div>
        </aside>
        ) : null}

        <section
          className={`chat-panel order-1 min-w-0 max-w-full xl:order-2 ${
            layout === "drawer"
              ? isMobileDrawer
                ? "flex flex-col overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm"
                : "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
              : isMobilePage
                ? "flex max-h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] min-h-[min(60dvh,560px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              : itineraryDraft
                ? "flex max-h-[min(88vh,900px)] min-h-[min(52vh,520px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm xl:max-h-[calc(100dvh-9rem)]"
                : "overflow-x-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
          }`}
        >
          {!reviewingItineraryDraft ? (
          <div
            className={`border-b border-slate-200 dark:border-[#1E293B] ${
              layout === "drawer"
                ? modePickerOpen
                  ? "max-h-[min(38dvh,280px)] shrink-0 overflow-y-auto overscroll-y-contain px-3 py-2 sm:px-4"
                  : "shrink-0 px-3 py-2 sm:px-4"
                : "px-4 py-3 sm:px-5 sm:py-4"
            }`}
          >
            {layout === "drawer" || isMobilePage ? (
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-semibold text-slate-600 dark:text-slate-400" title={focusModeSummary}>
                  {focusModeSummary}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModePickerOpen((open) => !open)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                      modePickerOpen
                        ? "border-[#F87171]/40 bg-[#F87171]/10 text-[#F87171]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300 dark:hover:bg-[#334155]"
                    }`}
                    aria-expanded={modePickerOpen}
                    aria-controls="trip-ai-mode-picker"
                    aria-label="Ajustes del chat"
                    title="Ajustes del chat"
                  >
                    <Settings className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-[#1E293B] dark:text-slate-400">
                    {loading ? "Pensando…" : "Listo"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-950">Conversación</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Modo:{" "}
                    <span className="font-semibold text-slate-800">
                      {modeSource === "auto" ? "Automático" : activeMode?.label || MODE_LABELS[mode] || mode}
                    </span>
                    {modeSource === "manual" && activeMode ? (
                      <span className="mt-0.5 block text-xs text-slate-500 xl:hidden">{activeMode.useFor}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 hidden text-xs text-slate-500 xl:block">
                    {modeSource === "auto"
                      ? "Modo automático: la intención se traduce en acción y resumen del viaje (sin enviar todo el historial)."
                      : "Modo manual: controlas el tipo de respuesta del asistente personal."}
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {loading ? "Pensando..." : "Listo"}
                </div>
              </div>
            )}

            {layout !== "drawer" && !isMobilePage ? (
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Elige el foco</p>
            ) : null}

            {(layout !== "drawer" && !isMobilePage) || modePickerOpen ? (
              <div id="trip-ai-mode-picker" className={layout === "drawer" || isMobilePage ? "mt-2" : undefined}>
                <div
                  data-tour="ai-suggestions"
                  className={
                    isMobileChatCompact
                      ? "grid grid-cols-2 gap-1.5 sm:gap-2"
                      : "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
                  }
                >
                  {ASSISTANT_FOCUS_PRESETS.map((preset) => {
                    const selected = modeSource === "manual" && mode === preset.id;
                    const Icon = preset.Icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        lang="es"
                        disabled={loading || aiBudgetExceeded}
                        onClick={() => {
                          beginNewChatForMode(preset.id, { onlyIfChanged: true });
                          collapseModePickerIfDrawer();
                        }}
                        className={`flex min-w-0 w-full flex-col items-start gap-1 overflow-hidden rounded-2xl border px-2.5 py-2 text-left transition disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:py-2.5 ${
                          isMobileChatCompact ? "min-h-[56px]" : "min-h-[88px]"
                        } ${
                          selected
                            ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)] shadow-sm ring-1 ring-[var(--brand-border)]"
                            : "border-slate-200 bg-slate-50/80 text-slate-800 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${selected ? "text-[var(--brand)]" : "text-slate-500"}`}
                          aria-hidden
                        />
                        <span className="w-full min-w-0 hyphens-auto break-words text-[11px] font-bold leading-snug sm:text-xs">
                          {preset.label}
                        </span>
                        <span className={`w-full min-w-0 break-words text-[10px] font-medium leading-snug text-slate-600 ${isMobileChatCompact ? "hidden" : ""}`}>
                          {preset.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={loading || aiBudgetExceeded}
                  onClick={() => {
                    beginNewChatForMode("auto", { onlyIfChanged: true });
                    collapseModePickerIfDrawer();
                  }}
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                    modeSource === "auto"
                      ? "border-cyan-400 bg-cyan-50 text-cyan-950 ring-1 ring-cyan-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Automático (detectar intención del mensaje)
                </button>
              </div>
            ) : null}
          </div>
          ) : null}

          {error ? (
            <div
              className={`mx-4 min-w-0 max-w-full break-words rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-5 ${
                layout === "drawer" ? "mt-2 shrink-0" : "mt-5"
              }`}
            >
              {error}
            </div>
          ) : null}

          {aiBudgetExceeded ? (
            <div
              className={`mx-4 min-w-0 max-w-full break-words rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:mx-5 ${
                layout === "drawer" ? "mt-2 shrink-0" : "mt-5"
              }`}
            >
              <span className="font-semibold">Límite mensual de IA alcanzado.</span> El asistente queda deshabilitado hasta el
              mes siguiente.
            </div>
          ) : null}

          {info && !reviewingItineraryDraft ? (
            <div
              className={`mx-4 min-w-0 max-w-full break-words rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-5 ${
                layout === "drawer" ? "mt-2 shrink-0" : "mt-5"
              }`}
            >
              {info}
            </div>
          ) : null}

          <div
            className={
              layout === "drawer"
                ? isMobileDrawer
                  ? "min-w-0 max-w-full space-y-4 overflow-visible px-3 py-2 sm:px-4"
                  : "min-h-0 min-w-0 max-w-full flex-1 space-y-5 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-3 sm:px-5"
                : isMobilePage
                  ? "min-h-0 min-w-0 max-w-full flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-2 sm:px-4"
                : layout === "page" && itineraryDraft
                  ? "min-h-0 min-w-0 max-w-full flex-1 space-y-5 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-3 sm:max-h-[min(28vh,240px)] sm:px-5"
                  : "max-md:max-h-none max-md:overflow-visible min-w-0 max-w-full space-y-5 overflow-y-auto overflow-x-hidden px-4 py-5 sm:max-h-[560px] sm:px-5"
            }
          >
            {mode === "day_planner" && (!hasAnyPlans || !hasAnyLodging) ? (
              <div className="rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 p-4 shadow-sm">
                <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">
                  Para crear rutas automáticamente
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {(!hasAnyPlans && !hasAnyLodging)
                    ? "Aún no hay planes ni alojamientos guardados."
                    : !hasAnyPlans
                      ? "Aún no hay planes guardados."
                      : "Aún no hay alojamientos guardados."}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Puedes ir a añadirlos ahora, o seguir creando rutas manualmente y revisarlas después.
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/trip/${encodeURIComponent(tripId)}/plan`}
                    className={`${btnPrimary} inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2 text-sm`}
                  >
                    Ir a añadir planes
                  </Link>
                  <Link
                    href={`/trip/${encodeURIComponent(tripId)}/map`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Introducir rutas manualmente
                  </Link>
                </div>
              </div>
            ) : null}

            {mode === "day_planner" && routesDraft?.routes?.length ? (
              <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-800">Rutas propuestas</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {routesDraft.routes.length} ruta{routesDraft.routes.length === 1 ? "" : "s"} · {routesDraft.date}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Pulsa para revisarlas en el formulario de Rutas (podrás editar y guardar una a una).
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${btnPrimary} shrink-0 rounded-2xl px-4 py-2 text-sm`}
                    onClick={() => {
                      try {
                        const key = `tripboard_routes_draft:${tripId}`;
                        window.sessionStorage.setItem(key, JSON.stringify(routesDraft));
                      } catch {
                        // ignore
                      }
                      router.push(`/trip/${encodeURIComponent(tripId)}/map?draftRoutes=1`);
                    }}
                  >
                    Revisar en Rutas
                  </button>
                </div>
              </div>
            ) : null}

            {mode === "day_planner" && missingCoords?.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-800">Faltan coordenadas</div>
                <div className="mt-1 text-sm font-semibold text-amber-950">
                  {missingCoords.length} plan{missingCoords.length === 1 ? "" : "es"} sin ubicación (lat/lng)
                </div>
                <div className="mt-2 space-y-1 text-sm text-amber-900/90">
                  {missingCoords.slice(0, 6).map((x) => (
                    <div key={`${x.date}:${x.id}`} className="flex flex-wrap gap-x-2">
                      <span className="font-semibold">{x.date}</span>
                      <span className="text-amber-950">{x.title}</span>
                    </div>
                  ))}
                  {missingCoords.length > 6 ? (
                    <div className="text-xs text-amber-800">… y {missingCoords.length - 6} más</div>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/trip/${encodeURIComponent(tripId)}/plan?date=${encodeURIComponent(missingCoords[0]!.date)}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100/60"
                  >
                    Ir a Plan y corregir
                  </Link>
                </div>
              </div>
            ) : null}

            {messages.map((message) => {
              const text = typeof message.content === "string" ? message.content : "";
              const travelDocs =
                message.role === "assistant" ? parseTravelDocsChecklistFromAnswer(text) : null;
              const searchRaw =
                message.role === "assistant" ? parseTravelSearchOffersFromAnswer(text) : null;
              const searchOffers = searchRaw ? enrichTravelSearchOffers(searchRaw, searchTripDefaults) : null;
              return (
                <div
                  key={message.id}
                  className={`flex w-full min-w-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-full flex-col gap-3 ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {/* AI1 — Differentiated bubbles */}
                    {message.role === "assistant" && (
                      <div className="flex items-start gap-2.5 max-w-[88%]">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm mt-0.5" aria-hidden>✦</div>
                        <div className="min-w-0 break-words whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-violet-200/60 bg-violet-50/70 px-4 py-3 text-sm leading-7 text-slate-800 dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-slate-200">
                          {stripAllKaviroJsonBlocksForDisplay(text)}
                        </div>
                      </div>
                    )}
                    {message.role === "user" && (
                      <div className="min-w-0 max-w-[88%] break-words whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-slate-950 dark:bg-[#F87171] px-4 py-3 text-sm leading-7 text-white">
                        {text}
                      </div>
                    )}
                    {travelDocs ? <TravelDocsChecklistCard tripId={tripId} payload={travelDocs} /> : null}
                    {searchOffers ? <TravelSearchOffersCard payload={searchOffers} /> : null}
                  </div>
                </div>
              );
            })}

            {/* AI3 — Typing indicator */}
            {loading ? (
              <div className="flex justify-start items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm mt-0.5" aria-hidden>✦</div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-violet-200/60 bg-violet-50/70 px-4 py-3.5 dark:border-[#1E293B] dark:bg-[#1E293B]">
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          {!hideChatForItineraryCards && !isMobileChatCompact ? (
            <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
              {documentImportSection}
              {chatComposerForm}
            </div>
          ) : null}
        </section>
      </section>
      ) : null}
        </div>
        {isMobileChatCompact ? (
          <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
            {documentImportSection}
            {chatComposerForm}
          </div>
        ) : null}
      </div>
    </Root>
  );
}
