import {
  CalendarDays,
  FileText,
  MessageCircle,
  Route,
  Search,
  Sparkles,
  Wallet,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { TripAiMode } from "@/lib/trip-ai/buildPrompt";
import type { TripAssistantSurface } from "@/lib/trip-assistant-context";

export type TripAiChatLayout = "page" | "drawer";

export type AssistantContextPreset = {
  mode: TripAiMode;
  modeSource: "auto" | "manual";
  welcome: string;
};

export type Conversation = {
  id: string;
  title: string;
  mode: TripAiMode;
  updated_at?: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
};

export const OPENING_TRAVEL_DOCS =
  "Dime tu nacionalidad y qué países vas a visitar o en los que harás escala, y miraré qué documentos o seguros necesitas.";

export const DEFAULT_PAGE_WELCOME =
  "Bienvenido ✈️\n\n" +
  "Elige abajo el **foco** del asistente (planificador, desplazamientos, buscar alojamiento/transporte, chat general o documentos). Escribe con naturalidad o pulsa «Sugerir itinerario» si el plan está vacío.\n\n" +
  "Cuando salga el itinerario en formato ejecutable, «Ejecutar plan» lo vuelca al mapa y al plan; los retoques puntuales van con «Aplicar cambios».";

export const SEARCH_FOCUS_WELCOME =
  "Modo **buscar alojamiento y transporte**\n\n" +
  "Puedo recomendarte **hoteles**, **vuelos**, **tren**, **ferry**, **autobús** o **coche de alquiler** usando las fechas y el destino de este viaje.\n\n" +
  "Te daré opciones con **precios orientativos** (no en tiempo real) y enlaces para **reservar** en comparadores como Booking, Google Flights, Omio o Rentalcars.\n\n" +
  "Ejemplos: «busca hoteles cerca del centro», «vuelos desde Barcelona ida y vuelta», «tren Madrid–Valencia» o «coche de alquiler en el aeropuerto».";

export const PLANNER_FOCUS_WELCOME =
  "Modo **Planificación profesional**\n\n" +
  "1. **Importar dossier** — Adjunta PDF o imagen del calendario (agencia, empresa). Extraemos vuelos, hoteles, traslados y excursiones con hora.\n" +
  "2. **Revisar tarjetas** — Cada día aparece con sus paradas; marca las que quieras y pulsa **«Añadir seleccionadas»**.\n" +
  "3. **Pegar texto** — También puedes pegar la agenda en el chat si prefieres.\n\n" +
  "Importante: las **fechas del viaje** (inicio y fin) deben coincidir con el calendario del dossier.";

export const DAY_FOCUS_WELCOME =
  "Modo **Desplazamientos y un día**\n\n" +
  "Una vez introducidos los alojamientos y planes vamos a crear las mejores rutas posibles.\n\n" +
  "Este modo está pensado para **traslados**: rutas entre paradas, a qué hora salir para llegar a tiempo y cómo moveros (andando, bici, coche o transporte público). Si ya tienes una actividad a las 10:00, puedo decirte la hora de salida recomendada y ayudarte a preparar la ruta.\n\n" +
  "Dime el día (por ejemplo **“10/11”**, **“10 de noviembre”**, **“día 2 del viaje”** o un rango **“del 10 al 12 de noviembre”**), el **modo de transporte** y el objetivo (por ejemplo: “llegar a las 10:00 a X”).";

export function assistantContextPreset(surface: TripAssistantSurface): AssistantContextPreset {
  switch (surface) {
    case "plan":
      return {
        mode: "planning",
        modeSource: "manual",
        welcome:
          "Estás en **Planificación profesional**.\n\n" +
          "Puedes **adjuntar el dossier** (PDF o imagen del calendario de la agencia): leemos vuelos, hoteles, excursiones y horarios, y generamos **tarjetas por día** para que las revises antes de añadirlas.\n\n" +
          "También puedes **pegar la agenda** en el chat o pedir un borrador desde cero. Comprueba que las **fechas del viaje** en ajustes coinciden con el calendario.",
      };
    case "routes":
      return {
        mode: "day_planner",
        modeSource: "manual",
        welcome:
          "Estás en Rutas: me centro en **desplazamientos** (trayectos entre paradas), a qué hora salir para llegar a tiempo y cómo moveros (andando, bici, coche o transporte público).\n\n" +
          "Dime el día o rango (p. ej. “día 2 del viaje” o “del 10 al 12”) y el modo de transporte, y preparo rutas para revisarlas en la pestaña de Rutas.",
      };
    case "expenses":
      return {
        mode: "expenses",
        modeSource: "manual",
        welcome:
          "Estás en Gastos: repasemos balances, quién debe a quién, ideas para repartir pagos y presupuesto del grupo.",
      };
    case "resources":
      return {
        mode: "travel_docs",
        modeSource: "manual",
        welcome: OPENING_TRAVEL_DOCS,
      };
    case "participants":
      return {
        mode: "general",
        modeSource: "manual",
        welcome:
          "Estás en Gente: conviene aclarar invitaciones, permisos (quién edita plan, rutas o gastos) y cómo presentar el viaje al grupo.",
      };
    case "summary":
      return {
        mode: "general",
        modeSource: "manual",
        welcome:
          "Estás en Resumen: puedo darte una visión general del viaje (fechas, destino, qué falta por preparar) y sugerirte los siguientes pasos.",
      };
    default:
      return { mode: "general", modeSource: "auto", welcome: "" };
  }
}

export function getManualModeWelcome(next: TripAiMode): string {
  switch (next) {
    case "travel_docs":
      return OPENING_TRAVEL_DOCS;
    case "planning":
      return PLANNER_FOCUS_WELCOME;
    case "day_planner":
      return DAY_FOCUS_WELCOME;
    case "general":
      return "Modo **chat general**. Cuéntame en qué puedo ayudarte con este viaje (resumen, dudas, recomendaciones).";
    case "expenses":
      return "Modo **gastos**. Pregunta por totales, balances, quién debe a quién o qué conviene registrar.";
    case "optimizer":
      return "Modo **optimizador**. Pide huecos en el plan, orden geográfico del día o ideas para aprovechar mejor el tiempo y las rutas.";
    case "actions":
      return "Modo **acciones** para cambios puntuales en el plan. Te explico qué propongo en lenguaje claro; si hay cambios aplicables, usa **«Aplicar cambios»** (sin JSON visible en el chat).";
    case "search":
      return SEARCH_FOCUS_WELCOME;
    default:
      return DEFAULT_PAGE_WELCOME;
  }
}

const KNOWN_TRIP_AI_MODES = new Set<string>([
  "general",
  "planning",
  "expenses",
  "optimizer",
  "actions",
  "day_planner",
  "travel_docs",
  "search",
]);

export function coerceTripAiMode(value: unknown): TripAiMode {
  return typeof value === "string" && KNOWN_TRIP_AI_MODES.has(value) ? (value as TripAiMode) : "general";
}

export function buildInitialWelcomeMessages(params: {
  layout: TripAiChatLayout;
  ctxPreset: AssistantContextPreset | null;
  defaultAssistantMode: TripAiMode | null;
}): Message[] {
  if (params.layout === "drawer" && params.ctxPreset?.welcome) {
    return [{ id: "welcome", role: "assistant", content: params.ctxPreset.welcome }];
  }
  if (params.defaultAssistantMode === "planning") {
    return [{ id: "welcome", role: "assistant", content: PLANNER_FOCUS_WELCOME }];
  }
  if (params.defaultAssistantMode === "day_planner") {
    return [{ id: "welcome", role: "assistant", content: DAY_FOCUS_WELCOME }];
  }
  if (params.defaultAssistantMode === "travel_docs") {
    return [{ id: "welcome", role: "assistant", content: OPENING_TRAVEL_DOCS }];
  }
  if (params.defaultAssistantMode === "search") {
    return [{ id: "welcome", role: "assistant", content: SEARCH_FOCUS_WELCOME }];
  }
  return [{ id: "welcome", role: "assistant", content: DEFAULT_PAGE_WELCOME }];
}

export const ASSISTANT_FOCUS_PRESETS: Array<{
  id: TripAiMode;
  label: string;
  description: string;
  Icon: LucideIcon;
}> = [
  { id: "general", label: "General", description: "Resúmenes, dudas amplias y recomendaciones.", Icon: MessageCircle },
  { id: "planning", label: "Planificación", description: "Varios días, itinerario completo + «Ejecutar plan».", Icon: CalendarDays },
  { id: "day_planner", label: "Organizar día", description: "Un solo día: horarios, comidas y desplazamientos.", Icon: Route },
  { id: "search", label: "Buscar", description: "Hoteles, vuelos, tren, ferry, bus o coche con enlaces.", Icon: Search },
  { id: "travel_docs", label: "Documentos", description: "Visados, seguros y requisitos por nacionalidad.", Icon: FileText },
  { id: "expenses", label: "Gastos", description: "Totales, quién debe a quién e ideas para pagar.", Icon: Wallet },
  { id: "optimizer", label: "Optimizador", description: "Huecos, solapes y mejoras en el plan.", Icon: Sparkles },
  { id: "actions", label: "Acciones", description: "Crear o modificar actividades y rutas (diff revisable).", Icon: Wand2 },
];

export type ModeOption = {
  id: TripAiMode;
  label: string;
  useFor: string;
};

export const MODE_OPTIONS: ModeOption[] = [
  { id: "general", label: "General", useFor: "Resúmenes, qué tienes guardado, recomendaciones generales." },
  { id: "planning", label: "Planificación", useFor: "Varios días, orden de visitas, propuestas de agenda (itinerario en JSON + «Ejecutar plan»)." },
  { id: "expenses", label: "Gastos", useFor: "Cuánto se ha gastado, quién debe a quién, ideas para pagar." },
  { id: "optimizer", label: "Optimizador", useFor: "Detectar huecos, solapes o formas de aprovechar mejor el plan." },
  { id: "actions", label: "Acciones", useFor: "Pedir al asistente personal que cree o modifique actividades/rutas vía «diff» revisable." },
  { id: "day_planner", label: "Organizar día", useFor: "Un solo día: horarios, comidas, desplazamientos; guardas con «Aplicar cambios» (no «Ejecutar plan»)." },
  { id: "search", label: "Buscar", useFor: "Buscar hoteles, vuelos, trenes, ferries, autobuses o coche de alquiler con datos del viaje pre-rellenados." },
  { id: "travel_docs", label: "Documentos del viaje", useFor: "Visados, seguros, tasas y requisitos según nacionalidad y países a visitar." },
];

export const MODE_LABELS: Record<TripAiMode, string> = {
  general: "General",
  planning: "Planificación",
  expenses: "Gastos",
  optimizer: "Optimizador",
  actions: "Acciones",
  day_planner: "Organizar día",
  travel_docs: "Documentos",
  search: "Buscar",
};

export const PLACEHOLDERS: Record<TripAiMode, string> = {
  general: "Ej.: hazme un resumen del viaje o qué documentos conviene llevar…",
  planning: "Ej.: dame un plan de 3 días en Roma o reorganiza mis visitas…",
  expenses: "Ej.: ¿cuánto llevamos gastado? ¿quién debe a quién?…",
  optimizer: "Ej.: detecta huecos en mi plan o sugiere mejoras…",
  actions: "Ej.: añade una cena el viernes en el plan o crea una ruta entre dos puntos…",
  day_planner: "Ej.: organízame el 2026-06-15 en Ámsterdam, andando, de 10:00 a 21:00… (luego «Aplicar cambios» para guardar)",
  search: "Ej.: busca hoteles con piscina cerca del centro, o vuelos baratos para estas fechas…",
  travel_docs: "Ej.: pasaporte español, viajo a Marruecos y Turquía en junio — ¿qué documentos y trámites necesito?",
};
