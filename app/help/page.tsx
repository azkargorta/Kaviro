import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayuda · Kaviro",
  description: "Preguntas frecuentes sobre Kaviro — cómo organizar viajes en grupo, gestionar gastos, el plan Premium y más.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué es Kaviro?",
    a: "Kaviro es una app para organizar viajes en grupo. Tienes el plan del viaje con actividades por día, mapa con rutas, gastos compartidos con balances automáticos, gestión de participantes con roles, documentos adjuntos y un asistente IA que planifica el itinerario completo por ti.",
  },
  {
    q: "¿Es gratis?",
    a: "Sí. El plan gratuito incluye todo lo esencial: plan del viaje, mapa, gastos, participantes y documentos. El plan Premium (3,99€/mes) añade el asistente IA, análisis de documentos con IA y generación automática de rutas óptimas.",
  },
  {
    q: "¿Cuántas personas pueden estar en un viaje?",
    a: "En el plan gratuito hasta 5 participantes. En Premium no hay límite. Cada persona puede tener un rol distinto: Organizador, Editor, Colaborador o Visor.",
  },
  {
    q: "¿Cómo invito a alguien a mi viaje?",
    a: "Desde la pestaña Gente del viaje puedes generar un enlace de invitación y enviarlo por WhatsApp. También hay un código QR. El invitado se registra o entra con su cuenta y queda vinculado automáticamente al viaje.",
  },
  {
    q: "¿Los gastos se calculan solos?",
    a: "Sí. Kaviro calcula automáticamente quién debe dinero a quién y cuánto, según quién pagó cada gasto y entre quiénes se divide. También puedes configurar el Bizum, PayPal o cuenta bancaria de cada participante para facilitar los pagos.",
  },
  {
    q: "¿Puedo usar Kaviro para un viaje ya empezado?",
    a: "Perfectamente. Puedes añadir actividades, gastos y participantes en cualquier momento, antes, durante o después del viaje. El historial se guarda siempre.",
  },
  {
    q: "¿Qué hace exactamente el asistente IA?",
    a: "El asistente conoce tu viaje completo (destino, fechas, actividades, gastos y participantes) y puede crear itinerarios completos, sugerir actividades, reorganizar el plan para reducir desplazamientos, calcular balances, generar rutas óptimas y responder preguntas sobre el destino. Tiene 8 modos especializados.",
  },
  {
    q: "¿Funciona sin conexión?",
    a: "Kaviro es una PWA (Progressive Web App) que puedes instalar en el móvil desde el navegador. La app requiere conexión a internet para funcionar — sincronización, IA y datos del grupo necesitan red. Algunas imágenes y assets se cachean para carga más rápida.",
  },
  {
    q: "¿Cómo cancelo el plan Premium?",
    a: "Desde tu cuenta (kaviro.app/account) → botón «Gestionar suscripción». Accedes al portal de Stripe donde puedes cancelar sin llamar a nadie. Si cancelas, el Premium se mantiene activo hasta el final del período ya pagado.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Kaviro usa Supabase como base de datos con cifrado en tránsito y en reposo. Los pagos los procesa Stripe, que nunca comparte datos de tarjeta con nosotros. Puedes leer la política de privacidad completa en kaviro.app/privacy.",
  },
  {
    q: "¿Puedo exportar mi viaje?",
    a: "Sí. Desde el Plan puedes exportar el itinerario a PDF o a calendario (.ics) compatible con Google Calendar, Apple Calendar y Outlook. Los gastos se pueden exportar a CSV para abrir en Excel.",
  },
  {
    q: "¿Cómo contacto con soporte?",
    a: "Dentro de la app, en cualquier viaje, el asistente IA puede atender dudas básicas. Para soporte humano, escríbenos a hola@kaviro.app con el asunto «Soporte» y respondemos lo antes posible.",
  },
];

export default function HelpPage() {
  return (
    <main className="page-shell pb-16 space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-12 md:px-10 md:py-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Kaviro</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Centro de ayuda
        </h1>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          Todo lo que necesitas saber para organizar tu viaje en grupo sin líos.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/register"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#F87171] px-5 text-sm font-bold text-white transition hover:bg-[#EF4444]"
          >
            Empezar gratis
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Ver precios
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
          Preguntas frecuentes
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1E293B] dark:bg-[#0F1623]"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">{q}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center dark:border-[#1E293B] dark:bg-[#080C14]">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          ¿No encuentras lo que buscas?
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Escríbenos a{" "}
          <a href="mailto:hola@kaviro.app" className="font-semibold text-[#F87171] hover:underline">
            hola@kaviro.app
          </a>{" "}
          y respondemos lo antes posible.
        </p>
      </div>
    </main>
  );
}
