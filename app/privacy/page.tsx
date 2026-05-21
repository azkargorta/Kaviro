import LegalDocumentLayout, { legalPageMetadata } from "@/components/legal/LegalDocumentLayout";
import { APP_NAME, LEGAL_CONTACT_EMAIL, LEGAL_CONTROLLER_LABEL } from "@/lib/brand";

export const metadata = legalPageMetadata(
  "Política de privacidad",
  "Información sobre el tratamiento de datos personales en Kaviro conforme al RGPD."
);

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Política de privacidad" updated="mayo de 2026">
      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos personales en {APP_NAME} es <strong>{LEGAL_CONTROLLER_LABEL}</strong>.
        Puedes contactarnos en{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> para cualquier cuestión relacionada con
        privacidad o ejercicio de derechos.
      </p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> dirección de correo electrónico, nombre de usuario y contraseña (almacenada
          de forma cifrada por nuestro proveedor de autenticación).
        </li>
        <li>
          <strong>Datos del viaje:</strong> nombre del viaje, destino, fechas, participantes, actividades, rutas, gastos,
          documentos y listas que tú o tu grupo introducís en la aplicación.
        </li>
        <li>
          <strong>Datos de uso:</strong> registros técnicos necesarios para el funcionamiento (sesión, errores, uso de
          funciones de IA dentro de los límites del plan).
        </li>
        <li>
          <strong>Pagos:</strong> si contratas Premium, Stripe procesa los datos de pago; nosotros recibimos identificadores
          de cliente y estado de suscripción, no el número completo de tu tarjeta.
        </li>
        <li>
          <strong>Notificaciones push (opcional):</strong> si las activas, almacenamos la suscripción push asociada a tu
          dispositivo.
        </li>
      </ul>

      <h2>3. Finalidades y base legal</h2>
      <ul>
        <li>
          <strong>Prestación del servicio</strong> (ejecución del contrato): crear tu cuenta, sincronizar viajes con tu
          grupo, mapas, gastos y asistente IA según tu plan.
        </li>
        <li>
          <strong>Mejora y seguridad</strong> (interés legítimo): analizar errores, prevenir abusos y mejorar la
          experiencia de producto de forma agregada.
        </li>
        <li>
          <strong>Comunicaciones transaccionales</strong> (ejecución del contrato / obligación legal): confirmación de
          registro, recuperación de contraseña y avisos relacionados con tu cuenta.
        </li>
        <li>
          <strong>Facturación Premium</strong> (ejecución del contrato): gestionar suscripciones a través de Stripe.
        </li>
      </ul>

      <h2>4. Destinatarios y encargados</h2>
      <p>Compartimos datos solo con proveedores que nos ayudan a operar el servicio, bajo contrato y medidas de seguridad:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — base de datos, autenticación y almacenamiento (UE/EEE o regiones acordadas en su
          DPA).
        </li>
        <li>
          <strong>Vercel</strong> — alojamiento de la aplicación web.
        </li>
        <li>
          <strong>Stripe</strong> — procesamiento de pagos y portal de facturación.
        </li>
        <li>
          <strong>Google (Gemini)</strong> — cuando usas funciones de IA Premium, se envían fragmentos del contexto del
          viaje y tu pregunta para generar respuestas (sin vender tus datos a terceros con fines publicitarios).
        </li>
        <li>
          <strong>Proveedor de email</strong> — envío de correos transaccionales (p. ej. Resend u otro SMTP configurado en
          Supabase).
        </li>
      </ul>
      <p>No vendemos tus datos personales a terceros.</p>

      <h2>5. Conservación</h2>
      <p>
        Conservamos los datos mientras mantengas tu cuenta activa. Si solicitas la eliminación de la cuenta, borraremos o
        anonimizaremos tus datos en un plazo razonable, salvo obligación legal de conservación (p. ej. facturación).
      </p>

      <h2>6. Tus derechos (RGPD)</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>
          <strong>Acceso</strong> — saber qué datos tratamos sobre ti.
        </li>
        <li>
          <strong>Rectificación</strong> — corregir datos inexactos (p. ej. desde tu cuenta o escribiéndonos).
        </li>
        <li>
          <strong>Supresión</strong> — solicitar el borrado de tu cuenta y datos asociados.
        </li>
        <li>
          <strong>Oposición y limitación</strong> — en los casos previstos por la ley.
        </li>
        <li>
          <strong>Portabilidad</strong> — recibir tus datos en formato estructurado cuando aplique.
        </li>
        <li>
          <strong>Retirar el consentimiento</strong> — cuando el tratamiento se base en consentimiento (p. ej. cookies no
          esenciales).
        </li>
      </ul>
      <p>
        Para ejercer estos derechos, escribe a{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> indicando tu email de registro. También
        puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).
      </p>

      <h2>7. Cookies y almacenamiento local</h2>
      <p>Utilizamos:</p>
      <ul>
        <li>
          <strong>Cookies esenciales / sesión</strong> — necesarias para iniciar sesión y mantener tu acceso seguro
          (Supabase Auth).
        </li>
        <li>
          <strong>Preferencias en localStorage</strong> — tema claro/oscuro, consentimiento de cookies, estado del tour
          demo y preferencias de la interfaz.
        </li>
        <li>
          <strong>Cookies analíticas (solo si aceptas)</strong> — medición agregada de uso para mejorar el producto; no
          son obligatorias para usar la app.
        </li>
      </ul>
      <p>Puedes gestionar las cookies no esenciales desde el banner de la web o la configuración de tu navegador.</p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables (HTTPS, control de acceso por viaje, políticas RLS en base de
        datos). Ningún sistema es 100 % infalible; te recomendamos usar contraseñas robustas y no compartir enlaces
        privados de invitación con personas no deseadas.
      </p>

      <h2>9. Menores</h2>
      <p>
        El servicio no está dirigido a menores de 16 años. Si detectamos una cuenta de un menor sin consentimiento parental
        válido, la eliminaremos a petición.
      </p>

      <h2>10. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la fecha de revisión en esta página. El uso continuado del servicio
        tras cambios relevantes implica que has leído la versión actualizada.
      </p>
    </LegalDocumentLayout>
  );
}
