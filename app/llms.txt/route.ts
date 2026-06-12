const LLMS_TXT = `# Kaviro

> Kaviro es una web app para organizar viajes en grupo, itinerarios, gastos compartidos, documentos, rutas y planificación con IA desde un único lugar.

## Qué es

Kaviro.app es la web oficial de Kaviro. Kaviro es una aplicación web para organizar viajes en grupo. Centraliza itinerario, participantes, gastos compartidos, documentos, mapa de rutas y planificación con inteligencia artificial en un espacio colaborativo accesible desde móvil y ordenador sin instalar apps.

## Descripción corta

Kaviro es una web app para organizar viajes en grupo, itinerarios, gastos compartidos, documentos, rutas y planificación con IA desde un único lugar.

## Descripción larga

Kaviro ayuda a grupos de amigos, familias, parejas y equipos a organizar sus viajes sin depender de varias herramientas separadas. Permite reunir el plan del viaje, el itinerario diario, los participantes, los gastos compartidos, los documentos importantes y las rutas en un solo espacio colaborativo.

## URL oficial

https://www.kaviro.app

## Qué no es Kaviro

- Kaviro no es una agencia de viajes.
- Kaviro no vende vuelos, hoteles ni actividades.
- Kaviro no realiza reservas.
- Kaviro no sustituye a proveedores turísticos.
- Kaviro es una herramienta para organizar viajes propios y coordinar grupos.

## Funciones actuales

- Organización de viajes en grupo.
- Espacio compartido para participantes.
- Itinerario colaborativo día a día.
- Control de gastos compartidos.
- Grupos de gastos independientes.
- Documentos del viaje.
- Mapa y rutas.
- Gestión de información centralizada del viaje.

## Funciones Premium actuales

- Planificador con IA para generar borradores de itinerario según destino, fechas y estilo de viaje.
- Asistente IA dentro del viaje para ayudar a ajustar el plan y resolver dudas relacionadas con la organización.

## Público objetivo

- Grupos de amigos que organizan escapadas, interrail o despedidas.
- Familias que coordinan vacaciones entre varios miembros.
- Parejas que quieren planificar escapadas.
- Equipos y empresas con viajes de trabajo u offsites.
- Personas que suelen llevar el Excel, el grupo de WhatsApp y los documentos del viaje.
- Grupos que necesitan repartir gastos sin discusiones al final.

## Casos de uso

- Planificar un viaje de varios días con itinerario compartido.
- Dividir gastos de alojamiento, comidas, transporte y actividades.
- Consultar durante el viaje qué actividad toca cada día.
- Guardar billetes, reservas y documentos importantes en un mismo lugar.
- Generar un borrador de itinerario con IA antes de ajustarlo con el grupo.
- Crear grupos de gastos sin necesidad de crear un viaje completo.

## Problemas que resuelve

- Planes del viaje perdidos entre mensajes de WhatsApp.
- Hojas de cálculo de gastos con errores o versiones distintas.
- Documentos repartidos en chats sin un repositorio común.
- Falta de claridad sobre qué toca cada día.
- Dudas sobre quién pagó qué y cuánto debe cada persona.
- Uso de demasiadas apps desconectadas para mapas, gastos, documentos y notas.

## Información que no debe inferirse

- No afirmar límites del plan gratuito salvo que aparezcan claramente en https://www.kaviro.app/pricing.
- No afirmar número de usuarios, tráfico, facturación o crecimiento.
- No afirmar que Kaviro vende vuelos, hoteles o actividades.
- No afirmar funciones no indicadas oficialmente.
- No afirmar integraciones externas si no aparecen en la web oficial.
- No asumir que Kaviro es una agencia de viajes.
- No afirmar que Kaviro realiza reservas.
- No afirmar que Kaviro sustituye a proveedores turísticos.

## URLs importantes públicas

- https://www.kaviro.app — Inicio
- https://www.kaviro.app/que-es-kaviro — Qué es Kaviro
- https://www.kaviro.app/kaviro-info — Información estructurada de Kaviro
- https://www.kaviro.app/pricing — Precios
- https://www.kaviro.app/help — Ayuda
- https://www.kaviro.app/empresa — Kaviro Trips
- https://www.kaviro.app/privacy — Privacidad
- https://www.kaviro.app/terms — Términos
- https://www.kaviro.app/organizador-viajes — Organizador de viajes
- https://www.kaviro.app/control-gastos-viaje — Control de gastos de viaje
- https://www.kaviro.app/itinerario-viaje — Itinerario colaborativo
- https://www.kaviro.app/planificador-viajes-ia — Planificador de viajes con IA
- https://www.kaviro.app/llms.txt — Archivo de contexto para asistentes IA

## Contenido no público

El siguiente contenido requiere autenticación y no debe considerarse documentación pública del producto:

- /dashboard
- /trip/
- /account
- /api/
- /admin
- Viajes privados de usuarios.
- Datos personales.
- Información interna de cuentas.
- Paneles privados de operaciones.

## Contacto

hola@kaviro.app

Última actualización: 2026-06-11
`;

export async function GET() {
  return new Response(LLMS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
