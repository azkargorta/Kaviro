import LegalDocumentLayout, { legalPageMetadata } from "@/components/legal/LegalDocumentLayout";
import { APP_NAME, APP_DOMAIN, LEGAL_CONTACT_EMAIL } from "@/lib/brand";

export const metadata = legalPageMetadata(
  "Términos y condiciones",
  "Condiciones de uso del servicio Kaviro."
);

export default function TermsPage() {
  return (
    <LegalDocumentLayout title="Términos y condiciones" updated="mayo de 2026">
      <h2>1. Objeto</h2>
      <p>
        Estos términos regulan el acceso y uso de {APP_NAME} ({APP_DOMAIN}), una aplicación para organizar viajes en grupo
        (plan, gastos, rutas, documentos y asistente IA). Al registrarte o usar el servicio, aceptas estas condiciones y
        nuestra <a href="/privacy">política de privacidad</a>.
      </p>

      <h2>2. Cuenta y elegibilidad</h2>
      <ul>
        <li>Debes proporcionar información veraz y mantener la confidencialidad de tus credenciales.</li>
        <li>Eres responsable de la actividad realizada con tu cuenta.</li>
        <li>Debes tener capacidad legal para contratar o contar con autorización de tu tutor si eres menor.</li>
      </ul>

      <h2>3. Planes y pagos</h2>
      <ul>
        <li>
          <strong>Plan gratuito:</strong> incluye funciones básicas con límites (p. ej. número de viajes activos) según
          la información publicada en la página de precios.
        </li>
        <li>
          <strong>Plan Premium:</strong> suscripción de pago gestionada por Stripe. Los precios, periodicidad y renovación
          automática se muestran antes del checkout. Puedes cancelar desde el portal de cliente de Stripe accesible desde
          tu cuenta.
        </li>
        <li>
          <strong>Referidos y promociones:</strong> meses Premium gratuitos por invitaciones están sujetos a las reglas
          vigentes en la app y pueden modificarse con preaviso razonable.
        </li>
      </ul>

      <h2>4. Uso permitido</h2>
      <p>Te comprometes a no:</p>
      <ul>
        <li>Usar el servicio para fines ilegales o que vulneren derechos de terceros.</li>
        <li>Intentar acceder a datos de viajes ajenos sin autorización.</li>
        <li>Automatizar abusivamente la API, sobrecargar infraestructura o eludir límites del plan.</li>
        <li>Subir malware o contenido que infrinja propiedad intelectual.</li>
      </ul>

      <h2>5. Contenido del usuario</h2>
      <p>
        Conservas la titularidad de los datos y contenidos que subes (itinerarios, gastos, documentos). Nos concedes una
        licencia limitada para alojarlos, procesarlos y mostrarlos a los participantes que invites, únicamente para
        prestar el servicio.
      </p>

      <h2>6. Asistente IA y recomendaciones</h2>
      <p>
        Las sugerencias del asistente (itinerarios, búsqueda de transporte, documentos de viaje, etc.) son orientativas.
        No sustituyen asesoramiento profesional (sanitario, legal, consular). Comprueba siempre precios, horarios y
        requisitos en fuentes oficiales antes de reservar o viajar.
      </p>

      <h2>7. Disponibilidad y cambios</h2>
      <p>
        Procuramos alta disponibilidad pero no garantizamos ausencia de interrupciones. Podemos modificar funciones,
        precios o estos términos; los cambios sustanciales se comunicarán por medios razonables (email o aviso en la app).
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, {APP_NAME} no será responsable de daños indirectos, lucro cesante o decisiones
        de viaje basadas en información de la app. Nuestra responsabilidad total por daños directos derivados del servicio
        de pago se limitará, como máximo, a las cantidades abonadas por ti en los doce meses anteriores al hecho causante.
      </p>

      <h2>9. Cancelación y eliminación</h2>
      <p>
        Puedes dejar de usar el servicio y eliminar tu cuenta desde la zona de cuenta. Podemos suspender o cerrar cuentas
        que incumplan gravemente estos términos.
      </p>

      <h2>10. Ley aplicable</h2>
      <p>
        Salvo norma imperativa en tu país de consumo, estos términos se rigen por la legislación española. Las disputas se
        someterán a los tribunales que correspondan según la normativa de consumidores y usuarios.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Consultas sobre estos términos:{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalDocumentLayout>
  );
}
