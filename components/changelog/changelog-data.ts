import type { ElementType } from "react";
import { Calendar, Zap, Map, CreditCard, Users, Star, Shield, Sparkles } from "lucide-react";

export type ChangelogRelease = {
  version: string;
  date: string;
  tag: "nuevo" | "mejora" | "fix" | "premium";
  title: string;
  items: { icon: ElementType; text: string }[];
};

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "v15",
    date: "Mayo 2026",
    tag: "nuevo",
    title: "Plan renovado, novedades del viaje y tour ampliado",
    items: [
      { icon: Calendar, text: "Itinerario coral por días: pestañas con flechas, avatares del grupo y resumen de gastos integrado" },
      { icon: Sparkles, text: "Badge «IA sugiere» en la cabecera del plan — análisis Premium del itinerario completo" },
      { icon: Users, text: "Visibilidad por actividad: todo el viaje, solo tú o participantes seleccionados" },
      { icon: Star, text: "RSVP en actividades y pestaña Asistencia: quién va, pendientes y totales por día" },
      { icon: Zap, text: "Campana de novedades: feed con cambios del plan, gastos e invitaciones sin leer" },
      { icon: Map, text: "Tour demo con paso de Asistencia y RSVP de ejemplo (Ana, Luis, María) en el viaje Londres" },
    ],
  },
  {
    version: "v14",
    date: "Mayo 2026",
    tag: "nuevo",
    title: "Tour interactivo y viaje demo",
    items: [
      { icon: Sparkles, text: "Tour guiado con spotlight — ilumina cada funcionalidad en su sección del viaje demo" },
      { icon: Zap, text: "Viaje demo de Londres con actividades, gastos, rutas y participantes de ejemplo" },
      { icon: Star, text: "Valoraciones y comentarios en las actividades del plan" },
      { icon: Map, text: "3 rutas de ejemplo en el viaje demo (Westminster, Tower Bridge, Hyde Park)" },
    ],
  },
  {
    version: "v13",
    date: "Abril 2026",
    tag: "nuevo",
    title: "Admin, analytics y mejoras de onboarding",
    items: [
      { icon: Shield, text: "Panel de administración con gráficas de visitas y uso de IA" },
      { icon: Sparkles, text: "Sección demo colapsable en Mis Viajes con botón de visita guiada" },
      { icon: Zap, text: "Vista Recap mejorada con logo real de Kaviro y página de ayuda" },
      { icon: Star, text: "Barra de progreso en el tour (sin puntos individuales)" },
    ],
  },
  {
    version: "v12",
    date: "Marzo 2026",
    tag: "nuevo",
    title: "Spotlight tour y creación automática del viaje demo",
    items: [
      { icon: Sparkles, text: "Spotlight tour: overlay oscuro con recorte alrededor del elemento activo" },
      { icon: Map, text: "Navegación automática entre pestañas durante el tour guiado" },
      { icon: Zap, text: "Viaje demo creado automáticamente al registrarse — sin pasos extra" },
      { icon: Users, text: "Participantes, gastos y rutas preconfiguradas en el demo de Londres" },
    ],
  },
  {
    version: "v11",
    date: "Febrero 2026",
    tag: "mejora",
    title: "Plan mejorado: calendario, historial y PDF",
    items: [
      { icon: Calendar, text: "Vista Calendario del plan con actividades distribuidas por día" },
      { icon: Zap, text: "Historial de cambios del plan: quién editó qué y cuándo" },
      { icon: Star, text: "PDF con portada coral y diseño Kaviro" },
      { icon: Map, text: "Exportar actividades a Google Calendar, Apple Calendar y Outlook (.ics)" },
    ],
  },
  {
    version: "v10",
    date: "Enero 2026",
    tag: "nuevo",
    title: "Gastos multi-divisa y balances",
    items: [
      { icon: CreditCard, text: "Convertidor de moneda integrado con tipo de cambio en tiempo real" },
      { icon: Zap, text: "Balance automático: quién debe qué a quién calculado al instante" },
      { icon: Star, text: "Estadísticas de gastos por categoría y por persona" },
      { icon: Users, text: "Métodos de pago por participante (Bizum, PayPal, cuenta bancaria)" },
    ],
  },
  {
    version: "v9",
    date: "Diciembre 2025",
    tag: "premium",
    title: "Asistente IA con 7 modos especializados",
    items: [
      { icon: Sparkles, text: "7 modos: General, Planificación, Gastos, Optimizador, Acciones, Organizar día y Documentos" },
      { icon: Zap, text: "Historial de conversaciones guardado por viaje" },
      { icon: Star, text: "El asistente conoce destino, fechas, actividades y presupuesto del viaje" },
      { icon: Map, text: "Generación de rutas óptimas con IA basadas en las actividades del día" },
    ],
  },
];

export const CHANGELOG_TAG_STYLES: Record<string, string> = {
  nuevo: "bg-[#E1F5EE] text-[#085041] dark:bg-[#04342C] dark:text-[#9FE1CB]",
  mejora: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#26215C] dark:text-[#CECBF6]",
  fix: "bg-[#F1EFE8] text-[#5F5E5A] dark:bg-[#2C2C2A] dark:text-[#B4B2A9]",
  premium: "bg-[#FAECE7] text-[#993C1D] dark:bg-[#4A1B0C] dark:text-[#F0997B]",
};

export const CHANGELOG_TAG_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  mejora: "Mejora",
  fix: "Fix",
  premium: "Premium",
};
