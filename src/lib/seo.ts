import type { Metadata } from "next";

export const SITE_URL = "https://www.tchoua.com";

export type SeoLanguage = "fr" | "en" | "es" | "de";

export type PublicPageSeo = {
  path: string;
  titles: Record<SeoLanguage, string>;
  descriptions: Record<SeoLanguage, string>;
  priority: number;
};

const page = (
  path: string,
  titles: Record<SeoLanguage, string>,
  descriptions: Record<SeoLanguage, string>,
  priority = 0.7
): PublicPageSeo => ({ path, titles, descriptions, priority });

export const PUBLIC_PAGES: PublicPageSeo[] = [
  page(
    "/",
    {
      fr: "Tchoua — Gestion de tontines et d’associations en Afrique",
      en: "Tchoua — Tontine and association management in Africa",
      es: "Tchoua — Gestión de tontinas y asociaciones en África",
      de: "Tchoua — Tontinen- und Vereinsverwaltung in Afrika",
    },
    {
      fr: "Tchoua digitalise les tontines et associations : cotisations, prêts, solidarité, gouvernance, rapports et mobile money. Gratuit et open source.",
      en: "Tchoua digitizes tontines and associations: contributions, loans, solidarity, governance, reports and mobile money. Free and open source.",
      es: "Tchoua digitaliza tontinas y asociaciones: cotizaciones, préstamos, solidaridad, gobernanza, informes y mobile money. Gratis y open source.",
      de: "Tchoua digitalisiert Tontinen und Vereine: Beiträge, Kredite, Solidarität, Governance, Berichte und Mobile Money. Kostenlos und Open Source.",
    },
    1
  ),
  page(
    "/about",
    {
      fr: "À propos de Tchoua — Notre mission pour la solidarité africaine",
      en: "About Tchoua — Our mission for African solidarity",
      es: "Acerca de Tchoua — Nuestra misión para la solidaridad africana",
      de: "Über Tchoua — Unsere Mission für afrikanische Solidarität",
    },
    {
      fr: "Découvrez la mission, les valeurs et l’histoire de Tchoua, la plateforme open source qui digitalise la solidarité et les tontines africaines.",
      en: "Discover the mission, values and story of Tchoua, the open source platform digitizing African solidarity and tontines.",
      es: "Descubre la misión, los valores y la historia de Tchoua, la plataforma open source que digitaliza la solidaridad y las tontinas africanas.",
      de: "Entdecken Sie Mission, Werte und Geschichte von Tchoua, der Open-Source-Plattform für afrikanische Solidarität und Tontinen.",
    }
  ),
  page(
    "/security",
    {
      fr: "Sécurité et confidentialité — Tchoua",
      en: "Security and privacy — Tchoua",
      es: "Seguridad y privacidad — Tchoua",
      de: "Sicherheit und Datenschutz — Tchoua",
    },
    {
      fr: "Découvrez les mesures de sécurité, de confidentialité et de protection des données de la plateforme Tchoua.",
      en: "Learn about the security, privacy and data protection measures of the Tchoua platform.",
      es: "Conoce las medidas de seguridad, privacidad y protección de datos de la plataforma Tchoua.",
      de: "Erfahren Sie mehr über Sicherheit, Datenschutz und Datenverarbeitung der Tchoua-Plattform.",
    }
  ),
  page(
    "/mobile",
    {
      fr: "Application mobile Tchoua — Android et iOS",
      en: "Tchoua mobile app — Android and iOS",
      es: "Aplicación móvil Tchoua — Android e iOS",
      de: "Tchoua Mobile-App — Android und iOS",
    },
    {
      fr: "Téléchargez l’application mobile Tchoua et gérez vos tontines, cotisations, prêts et aides depuis votre téléphone.",
      en: "Download the Tchoua mobile app and manage your tontines, contributions, loans and aid from your phone.",
      es: "Descarga la aplicación móvil Tchoua y gestiona tus tontinas, cotizaciones, préstamos y ayudas desde tu teléfono.",
      de: "Laden Sie die Tchoua-App herunter und verwalten Sie Tontinen, Beiträge, Kredite und Hilfen von Ihrem Telefon aus.",
    }
  ),
  page(
    "/documentation",
    {
      fr: "Documentation Tchoua — Manuel complet et étude ARP",
      en: "Tchoua documentation — Complete manual and ARP study",
      es: "Documentación Tchoua — Manual completo y estudio ARP",
      de: "Tchoua-Dokumentation — Vollständiges Handbuch und ARP-Studie",
    },
    {
      fr: "Consultez le manuel complet de Tchoua, l’étude ARP et les guides pour configurer vos associations, tontines et activités.",
      en: "Read the complete Tchoua manual, the ARP study and guides to configure your associations, tontines and activities.",
      es: "Consulta el manual completo de Tchoua, el estudio ARP y las guías para configurar asociaciones, tontinas y actividades.",
      de: "Lesen Sie das vollständige Tchoua-Handbuch, die ARP-Studie und Anleitungen für Vereine, Tontinen und Aktivitäten.",
    },
    0.9
  ),
  page(
    "/fonctionnalites",
    {
      fr: "Fonctionnalités Tchoua — Tontines, prêts, solidarité",
      en: "Tchoua features — Tontines, loans, solidarity",
      es: "Funciones de Tchoua — Tontinas, préstamos, solidaridad",
      de: "Tchoua-Funktionen — Tontinen, Kredite, Solidarität",
    },
    {
      fr: "Cotisations, prêts, aides sociales, gouvernance, rapports et mobile money : découvrez toutes les fonctionnalités de Tchoua.",
      en: "Contributions, loans, social aid, governance, reports and mobile money: discover all Tchoua features.",
      es: "Cotizaciones, préstamos, ayudas sociales, gobernanza, informes y mobile money: descubre todas las funciones de Tchoua.",
      de: "Beiträge, Kredite, Sozialhilfe, Governance, Berichte und Mobile Money: alle Tchoua-Funktionen im Überblick.",
    }
  ),
  page(
    "/how-it-works",
    {
      fr: "Comment fonctionne Tchoua — Guide de démarrage",
      en: "How Tchoua works — Getting started guide",
      es: "Cómo funciona Tchoua — Guía de inicio",
      de: "So funktioniert Tchoua — Erste Schritte",
    },
    {
      fr: "Créez votre association, invitez vos membres, configurez vos activités et gérez vos tontines avec Tchoua.",
      en: "Create your association, invite members, configure activities and manage your tontines with Tchoua.",
      es: "Crea tu asociación, invita a tus miembros, configura actividades y gestiona tus tontinas con Tchoua.",
      de: "Verein erstellen, Mitglieder einladen, Aktivitäten konfigurieren und Tontinen mit Tchoua verwalten.",
    }
  ),
  page(
    "/academie",
    {
      fr: "Académie Tchoua — Formation à la gestion des tontines",
      en: "Tchoua Academy — Tontine management training",
      es: "Academia Tchoua — Formación en gestión de tontinas",
      de: "Tchoua-Akademie — Schulung zur Tontinenverwaltung",
    },
    {
      fr: "Apprenez à gérer une association et une tontine : rôles, cotisations, prêts, solidarité et gouvernance.",
      en: "Learn to manage an association and a tontine: roles, contributions, loans, solidarity and governance.",
      es: "Aprende a gestionar una asociación y una tontina: roles, cotizaciones, préstamos, solidaridad y gobernanza.",
      de: "Lernen Sie Verein und Tontine zu verwalten: Rollen, Beiträge, Kredite, Solidarität und Governance.",
    }
  ),
  page(
    "/developpeurs",
    {
      fr: "API et développeurs — Tchoua",
      en: "API and developers — Tchoua",
      es: "API y desarrolladores — Tchoua",
      de: "API und Entwickler — Tchoua",
    },
    {
      fr: "Documentation API, webhooks et ressources pour intégrer Tchoua à vos outils et services.",
      en: "API documentation, webhooks and resources to integrate Tchoua with your tools and services.",
      es: "Documentación API, webhooks y recursos para integrar Tchoua con tus herramientas y servicios.",
      de: "API-Dokumentation, Webhooks und Ressourcen zur Integration von Tchoua in Ihre Tools.",
    }
  ),
  page(
    "/templates",
    {
      fr: "Modèles d’associations et de tontines — Tchoua",
      en: "Association and tontine templates — Tchoua",
      es: "Plantillas de asociaciones y tontinas — Tchoua",
      de: "Vorlagen für Vereine und Tontinen — Tchoua",
    },
    {
      fr: "Découvrez des modèles prêts à l’emploi pour créer rapidement une tontine, une amicale, une coopérative ou une association.",
      en: "Find ready-to-use templates to quickly create a tontine, association, cooperative or community group.",
      es: "Descubre plantillas listas para crear rápidamente una tontina, asociación, cooperativa o grupo comunitario.",
      de: "Finden Sie Vorlagen für Tontinen, Vereine, Genossenschaften und Gemeinschaftsgruppen.",
    }
  ),
  page(
    "/aide",
    {
      fr: "Aide et support — Tchoua",
      en: "Help and support — Tchoua",
      es: "Ayuda y soporte — Tchoua",
      de: "Hilfe und Support — Tchoua",
    },
    {
      fr: "Trouvez des réponses à vos questions sur l’inscription, les tontines, les paiements, la sécurité et la gestion de votre association.",
      en: "Find answers about registration, tontines, payments, security and managing your association.",
      es: "Encuentra respuestas sobre registro, tontinas, pagos, seguridad y gestión de tu asociación.",
      de: "Antworten zu Registrierung, Tontinen, Zahlungen, Sicherheit und Vereinsverwaltung.",
    }
  ),
  page(
    "/confidentialite",
    {
      fr: "Politique de confidentialité — Tchoua",
      en: "Privacy policy — Tchoua",
      es: "Política de privacidad — Tchoua",
      de: "Datenschutzerklärung — Tchoua",
    },
    {
      fr: "Politique de confidentialité de Tchoua : données collectées, usages, partage, conservation et droits des utilisateurs.",
      en: "Tchoua privacy policy: data collected, purposes, sharing, retention and user rights.",
      es: "Política de privacidad de Tchoua: datos recopilados, usos, intercambio, conservación y derechos.",
      de: "Datenschutzerklärung von Tchoua: erhobene Daten, Zwecke, Weitergabe, Speicherung und Rechte.",
    }
  ),
  page(
    "/conditions-utilisation",
    {
      fr: "Conditions d’utilisation — Tchoua",
      en: "Terms of use — Tchoua",
      es: "Condiciones de uso — Tchoua",
      de: "Nutzungsbedingungen — Tchoua",
    },
    {
      fr: "Conditions d’utilisation de Tchoua : compte, services de tontine, obligations, responsabilité et droit applicable.",
      en: "Tchoua terms of use: account, tontine services, obligations, liability and applicable law.",
      es: "Condiciones de uso de Tchoua: cuenta, servicios de tontina, obligaciones, responsabilidad y ley aplicable.",
      de: "Tchoua-Nutzungsbedingungen: Konto, Tontinendienste, Pflichten, Haftung und anwendbares Recht.",
    }
  ),
];

export function languageAlternates(path: string): Record<string, string> {
  const clean = path === "/" ? "/" : path.replace(/\/+$/, "");
  return {
    fr: `${SITE_URL}${clean}?lang=fr`,
    en: `${SITE_URL}${clean}?lang=en`,
    es: `${SITE_URL}${clean}?lang=es`,
    de: `${SITE_URL}${clean}?lang=de`,
    "x-default": `${SITE_URL}${clean}`,
  };
}

const OG_LOCALES: Record<SeoLanguage, string> = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
};

export function publicPageMetadata(seo: PublicPageSeo, language: SeoLanguage = "fr"): Metadata {
  const title = seo.titles[language];
  const description = seo.descriptions[language];
  const canonical = `${SITE_URL}${seo.path}${language === "fr" ? "" : `?lang=${language}`}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: languageAlternates(seo.path),
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALES[language],
      url: canonical,
      siteName: "Tchoua",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
