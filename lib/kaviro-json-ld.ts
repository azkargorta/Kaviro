import {
  APP_NAME,
  APP_TAGLINE,
  KAVIRO_TRIPS_PRODUCT_NAME,
  LEGAL_CONTACT_EMAIL,
} from "@/lib/brand";
import {
  KAVIRO_LONG_DESCRIPTION,
  KAVIRO_OFFICIAL_URL,
  KAVIRO_PUBLIC_FAQS,
  type KaviroFaq,
} from "@/lib/kaviro-public-knowledge";

export function kaviroOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: KAVIRO_OFFICIAL_URL,
    email: LEGAL_CONTACT_EMAIL,
    description: APP_TAGLINE,
    sameAs: [] as string[],
  };
}

export function kaviroWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: KAVIRO_OFFICIAL_URL,
    description: KAVIRO_LONG_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: KAVIRO_OFFICIAL_URL,
    },
    inLanguage: "es",
  };
}

export function kaviroSoftwareApplicationJsonLd(pageUrl?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    url: pageUrl ?? KAVIRO_OFFICIAL_URL,
    description: KAVIRO_LONG_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Plan gratuito con funciones de organización de viajes",
      },
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Plan Premium con IA y funciones avanzadas — ver /pricing",
      },
    ],
    provider: {
      "@type": "Organization",
      name: APP_NAME,
      url: KAVIRO_OFFICIAL_URL,
    },
    featureList: [
      "Itinerario colaborativo",
      "Gastos compartidos",
      "Documentos del viaje",
      "Mapa y rutas",
      "Planificador con IA (Premium)",
      KAVIRO_TRIPS_PRODUCT_NAME,
    ],
  };
}

export function kaviroFaqPageJsonLd(faqs: KaviroFaq[] = KAVIRO_PUBLIC_FAQS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function kaviroBreadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${KAVIRO_OFFICIAL_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function kaviroPublicPageJsonLd(path: string, pageName: string, faqs?: KaviroFaq[]) {
  const pageUrl = `${KAVIRO_OFFICIAL_URL}${path}`;
  return [
    kaviroOrganizationJsonLd(),
    kaviroWebSiteJsonLd(),
    kaviroSoftwareApplicationJsonLd(pageUrl),
    kaviroFaqPageJsonLd(faqs),
    kaviroBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: pageName, path },
    ]),
  ];
}

export function kaviroHomeJsonLd() {
  return [kaviroOrganizationJsonLd(), kaviroWebSiteJsonLd(), kaviroSoftwareApplicationJsonLd()];
}
