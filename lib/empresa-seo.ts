import {
  AGENCY_PARTNERSHIP_EMAIL,
  APP_DOMAIN,
  APP_NAME,
  KAVIRO_TRIPS_PRODUCT_NAME,
  KAVIRO_TRIPS_TAGLINE,
} from "@/lib/brand";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://www.${APP_DOMAIN}`;

export const EMPRESA_PAGE_URL = `${BASE_URL}/empresa`;

export const EMPRESA_META_TITLE = `${KAVIRO_TRIPS_PRODUCT_NAME} — Software para agencias de viajes`;

export const EMPRESA_META_DESCRIPTION =
  "Herramienta y portal cliente para agencias de viajes: gestión de viajes en grupo, itinerarios, plantillas y app sin descarga para tus clientes.";

export const EMPRESA_KEYWORDS = [
  "software agencia de viajes",
  "herramienta gestión viajes grupos",
  "portal cliente agencia viajes",
  "app gestión grupos viaje",
  "kaviro trips agencias",
  KAVIRO_TRIPS_PRODUCT_NAME,
] as const;

export function empresaJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: KAVIRO_TRIPS_PRODUCT_NAME,
      url: EMPRESA_PAGE_URL,
      parentOrganization: {
        "@type": "Organization",
        name: APP_NAME,
        url: BASE_URL,
      },
      email: AGENCY_PARTNERSHIP_EMAIL,
      description: KAVIRO_TRIPS_TAGLINE,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: KAVIRO_TRIPS_PRODUCT_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: EMPRESA_PAGE_URL,
      description: EMPRESA_META_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Acceso con acuerdo de partnership; precio según volumen",
      },
      provider: {
        "@type": "Organization",
        name: APP_NAME,
        url: BASE_URL,
      },
    },
  ];
}
