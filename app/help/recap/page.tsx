import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Share2, ImageIcon, Star, Camera } from "lucide-react";

export const metadata = {
  title: "Cómo usar el Recap — Kaviro",
  description: "Aprende a compartir el resumen de tu viaje con foto, estadísticas y el botón de Stories.",
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#F87171]/10 flex items-center justify-center text-[#F87171]">
          {icon}
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 h-6 w-6 rounded-full bg-[#F87171] text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p>{text}</p>
    </div>
  );
}

export default function RecapHelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#080C14] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Centro de ayuda
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Image src="/brand/icon.png" alt="Kaviro" width={40} height={40} className="rounded-full" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Kaviro · Ayuda</p>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">El Recap del viaje</h1>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            El Recap es la página resumen que aparece al terminar tu viaje. Muestra estadísticas, categorías de actividades y te permite compartir un recuerdo visual con el grupo.
          </p>
        </div>

        {/* Sections */}
        <Section icon={<Camera className="h-5 w-5" />} title="Añadir una foto de portada">
          <p>El Recap muestra un espacio para añadir una foto del viaje en la parte superior de la tarjeta.</p>
          <div className="space-y-2">
            <Step n={1} text="Pulsa «Subir foto» para seleccionar una imagen de tu dispositivo (fotos del viaje, capturas...)." />
            <Step n={2} text="O pulsa «Foto del destino» — Kaviro busca automáticamente una foto turística del lugar en Unsplash." />
            <Step n={3} text="Puedes quitar la foto pulsando la × que aparece al pasar el ratón por encima." />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">
            La foto solo aparece en tu pantalla — no se guarda en el servidor ni es visible para otros.
          </p>
        </Section>

        <Section icon={<Star className="h-5 w-5" />} title="Estadísticas del viaje">
          <p>La tarjeta muestra automáticamente:</p>
          <ul className="space-y-1 ml-1">
            <li>• <strong>Días</strong> — duración total del viaje</li>
            <li>• <strong>Actividades</strong> — número de paradas en el plan</li>
            <li>• <strong>Viajeros</strong> — participantes en el viaje</li>
            <li>• <strong>Km aprox.</strong> — distancia total de las rutas (si tienes rutas creadas)</li>
          </ul>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Si no hay rutas, se muestra el número de destinos visitados en su lugar.
          </p>
        </Section>

        <Section icon={<Share2 className="h-5 w-5" />} title="Compartir por WhatsApp">
          <p>El botón <strong>WhatsApp</strong> abre el chat con un mensaje de texto ya redactado con los datos del viaje.</p>
          <p>En móvil (iOS/Android), el sistema intentará compartir también la imagen de la tarjeta usando el menú nativo de compartir. Si no aparece la imagen, usa el botón <strong>PNG</strong> primero para guardarla y adjúntala manualmente.</p>
        </Section>

        <Section icon={<Download className="h-5 w-5" />} title="Descargar como imagen">
          <p>Hay dos formatos de imagen:</p>
          <div className="space-y-2">
            <div className="rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-100 dark:border-[#1E293B] p-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">📥 PNG (cuadrado 1:1)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ideal para WhatsApp, grupos de chat o guardar en el carrete. Se descarga como archivo .svg que puedes compartir directamente.</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-100 dark:border-[#1E293B] p-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">📱 Stories (9:16 vertical)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Optimizado para Instagram Stories y WhatsApp Status. Incluye la frase de marca de Kaviro al pie.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Step n={1} text="Pulsa «PNG» o «Stories» para descargar la imagen." />
            <Step n={2} text="En iPhone: abre el archivo descargado → pulsa el icono de compartir → selecciona WhatsApp o Instagram." />
            <Step n={3} text="En Android: el archivo aparece en la carpeta de Descargas. Adjúntalo desde WhatsApp." />
          </div>
        </Section>

        <Section icon={<ImageIcon className="h-5 w-5" />} title="¿Por qué la imagen es SVG y no PNG?">
          <p>
            Los archivos SVG son imágenes vectoriales que se ven perfectos en cualquier tamaño. La mayoría de apps modernas (WhatsApp, Telegram, iMessage) los aceptan directamente.
          </p>
          <p>
            Si necesitas un PNG clásico, abre el SVG en el navegador, haz clic derecho y selecciona <em>«Guardar imagen como...»</em> — algunos navegadores permiten guardarlo como PNG.
          </p>
        </Section>

        {/* FAQ */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              {
                q: "¿El Recap se actualiza si añado más actividades?",
                a: "Sí. Los datos se calculan cada vez que abres el Recap, así que siempre refleja el estado actual del viaje.",
              },
              {
                q: "¿Pueden ver el Recap todos los participantes?",
                a: "Sí. Cualquier miembro del viaje puede acceder al Recap desde el sidebar o el menú «Más» en móvil.",
              },
              {
                q: "¿La foto que subo se guarda?",
                a: "No. La foto de portada solo existe en tu sesión actual. Si recargas la página tendrás que volver a subirla.",
              },
              {
                q: "¿Por qué no aparecen los km recorridos?",
                a: "Los km se calculan a partir de las rutas creadas en la pestaña «Rutas». Si no tienes rutas, verás el número de destinos en su lugar.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 dark:border-[#1E293B] pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{q}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-4">
          ¿Más preguntas?{" "}
          <Link href="/help" className="font-semibold text-[#F87171] hover:underline">
            Centro de ayuda
          </Link>{" "}
          o el asistente IA dentro del viaje.
        </p>
      </div>
    </main>
  );
}
