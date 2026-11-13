import type { PublicLang } from "./public-copy";

export type DocChapter = { n: string; title: string; desc: string; page: string };
export type DocPart = { title: string; chapters: DocChapter[] };

export type DocsCopy = {
  nav: string;
  badge: string;
  title1: string;
  title2: string;
  desc: string;
  download: string;
  read: string;
  notice: string;
  pages: string;
  captures: string;
  diagrams: string;
  version: string;
  contents: string;
  domainsTitle: string;
  domainsDesc: string;
  domains: { icon: string; title: string; desc: string }[];
  parts: DocPart[];
  langTitle: string;
  langDesc: string;
  cta: string;
  ctaDesc: string;
  home: { badge: string; title: string; desc: string; cards: { icon: string; title: string; desc: string }[] };
};

const fr: DocsCopy = {
  nav: "Documentation",
  badge: "Documentation officielle · Édition 2026",
  title1: "Le manuel complet",
  title2: "de Tchoua.",
  desc: "88 pages pour comprendre, paramétrer et exploiter la plateforme : associations, tontines, cotisations, prêts, solidarité, gouvernance, rapports et administration.",
  download: "Télécharger le PDF",
  read: "Parcourir le sommaire",
  notice: "Édition anonymisée : les noms des associations et des personnes ont été remplacés par des identifiants fictifs. Les montants, règles et captures restent concrets.",
  pages: "88 pages",
  captures: "24 captures réelles",
  diagrams: "10 schémas",
  version: "Version 1.1 · Novembre 2026",
  contents: "Sommaire",
  domainsTitle: "Tout ce que le manuel couvre",
  domainsDesc: "De la création de l'association à la clôture du cycle, chaque écran et chaque règle sont documentés.",
  domains: [
    { icon: "🏛️", title: "Associations", desc: "Types, sections, fédérations, statuts, règlements et cycle de vie." },
    { icon: "🔄", title: "Tontines", desc: "Parts, fractions, cycles, enchères, bénéficiaires et soldes." },
    { icon: "💳", title: "Cotisations", desc: "Sessions, présences, retards, amendes et collation." },
    { icon: "🏦", title: "Prêts", desc: "Demandes, garanties, décaissements, remboursements et intérêts." },
    { icon: "❤️", title: "Solidarité", desc: "Catalogue d'aides, plafonds, demandes et décaissements." },
    { icon: "📊", title: "Rapports", desc: "Historique, dividendes, exports PDF/CSV et audit." },
  ],
  parts: [
    {
      title: "Comprendre la plateforme",
      chapters: [
        { n: "1", title: "Vision et positionnement", desc: "Promesse, personas, différenciation.", page: "6" },
        { n: "2", title: "Architecture et sécurité", desc: "Stack, données, rôles, exploitation.", page: "9" },
        { n: "3", title: "Comptes et permissions", desc: "Rôles d'association et rôles système.", page: "14" },
        { n: "4", title: "Cycle de vie", desc: "Création, configuration, adhésion, clôture.", page: "18" },
        { n: "5", title: "Panorama des modules", desc: "Huit domaines, un noyau commun.", page: "24" },
      ],
    },
    {
      title: "Modules métier",
      chapters: [
        { n: "6", title: "Tontines et activités", desc: "Parts, cycles, enchères, bénéficiaires.", page: "29" },
        { n: "7", title: "Cotisations et sessions", desc: "Encaissements, présences, amendes.", page: "36" },
        { n: "8", title: "Prêts et intérêts", desc: "Garanties, échéances, répartition.", page: "41" },
        { n: "9", title: "Solidarité et aides", desc: "Catalogue, plafonds, workflow.", page: "46" },
        { n: "10", title: "Réunions et discipline", desc: "Quorums, PV, sanctions, collation.", page: "49" },
        { n: "11", title: "Comptabilité et dividendes", desc: "Caisses, rapports, répartition.", page: "52" },
        { n: "12", title: "Historique et analyses", desc: "Liste, kanban, graphique, grille.", page: "56" },
      ],
    },
    {
      title: "Exploitation et cas réels",
      chapters: [
        { n: "13", title: "Espace membre et mobile", desc: "Launchpad, thèmes, notifications.", page: "60" },
        { n: "14", title: "Administration", desc: "Modèles, utilisateurs, paramètres.", page: "65" },
        { n: "15", title: "Multilingue et international", desc: "Langues, devises, paiements.", page: "71" },
        { n: "16", title: "Cas réels anonymisés", desc: "Trois modèles, trois associations.", page: "73" },
        { n: "17", title: "Workflows de bout en bout", desc: "Scénarios, RACI, exceptions.", page: "77" },
        { n: "18", title: "Roadmap et limites", desc: "Trajectoire, sécurité, support.", page: "82" },
      ],
    },
    {
      title: "Annexes",
      chapters: [
        { n: "A", title: "Glossaire, API, checklist", desc: "Références et index des figures.", page: "85" },
      ],
    },
  ],
  langTitle: "Un manuel, plusieurs langues",
  langDesc: "Le site public est disponible en français, anglais, espagnol et allemand. Le manuel est rédigé en français ; les équipes peuvent le traduire et l'adapter à leur pays.",
  cta: "Créer mon association",
  ctaDesc: "La documentation est prête. La plateforme aussi.",
  home: {
    badge: "Documentation",
    title: "Le manuel complet, accessible à tous",
    desc: "88 pages, 10 schémas et 24 captures réelles pour comprendre chaque module et chaque règle.",
    cards: [
      { icon: "🔄", title: "Moteur de tontine", desc: "Parts, fractions, cycles, enchères, soldes." },
      { icon: "🏦", title: "Prêts et intérêts", desc: "Garanties, échéanciers, répartition au prorata." },
      { icon: "❤️", title: "Solidarité", desc: "Catalogue d'aides, plafonds, workflow." },
      { icon: "🏛️", title: "Gouvernance", desc: "Statuts, quorums, réunions, rôles." },
    ],
  },
};

const en: DocsCopy = {
  ...fr,
  nav: "Documentation",
  badge: "Official documentation · 2026 edition",
  title1: "The complete manual",
  title2: "for Tchoua.",
  desc: "88 pages to understand, configure and operate the platform: associations, tontines, contributions, loans, solidarity, governance, reports and administration.",
  download: "Download the PDF",
  read: "Browse the contents",
  notice: "Anonymized edition: association and people names have been replaced with fictional identifiers. Amounts, rules and screenshots remain concrete.",
  pages: "88 pages",
  captures: "24 real screenshots",
  diagrams: "10 diagrams",
  version: "Version 1.1 · November 2026",
  contents: "Contents",
  domainsTitle: "What the manual covers",
  domainsDesc: "From association creation to cycle closure, every screen and every rule is documented.",
  domains: [
    { icon: "🏛️", title: "Associations", desc: "Types, sections, federations, statutes, rules and lifecycle." },
    { icon: "🔄", title: "Tontines", desc: "Shares, fractions, cycles, auctions, beneficiaries and balances." },
    { icon: "💳", title: "Contributions", desc: "Sessions, attendance, late payments, fines and catering." },
    { icon: "🏦", title: "Loans", desc: "Requests, guarantees, disbursements, repayments and interest." },
    { icon: "❤️", title: "Solidarity", desc: "Aid catalogue, caps, requests and payouts." },
    { icon: "📊", title: "Reports", desc: "History, dividends, PDF/CSV exports and audit." },
  ],
  parts: [
    { title: "Understanding the platform", chapters: [
      { n: "1", title: "Vision and positioning", desc: "Promise, personas, differentiation.", page: "6" },
      { n: "2", title: "Architecture and security", desc: "Stack, data, roles, operations.", page: "9" },
      { n: "3", title: "Accounts and permissions", desc: "Association and system roles.", page: "14" },
      { n: "4", title: "Lifecycle", desc: "Creation, configuration, membership, closure.", page: "18" },
      { n: "5", title: "Module overview", desc: "Eight domains, one shared core.", page: "24" },
    ]},
    { title: "Business modules", chapters: [
      { n: "6", title: "Tontines and activities", desc: "Shares, cycles, auctions, beneficiaries.", page: "29" },
      { n: "7", title: "Contributions and sessions", desc: "Payments, attendance, fines.", page: "36" },
      { n: "8", title: "Loans and interest", desc: "Guarantees, schedules, allocation.", page: "41" },
      { n: "9", title: "Solidarity and aid", desc: "Catalogue, caps, workflow.", page: "46" },
      { n: "10", title: "Meetings and discipline", desc: "Quorums, minutes, sanctions, catering.", page: "49" },
      { n: "11", title: "Accounting and dividends", desc: "Funds, reports, distribution.", page: "52" },
      { n: "12", title: "History and analytics", desc: "List, kanban, chart, grid.", page: "56" },
    ]},
    { title: "Operations and real cases", chapters: [
      { n: "13", title: "Member area and mobile", desc: "Launchpad, themes, notifications.", page: "60" },
      { n: "14", title: "Administration", desc: "Templates, users, settings.", page: "65" },
      { n: "15", title: "Multilingual and international", desc: "Languages, currencies, payments.", page: "71" },
      { n: "16", title: "Anonymized real cases", desc: "Three models, three associations.", page: "73" },
      { n: "17", title: "End-to-end workflows", desc: "Scenarios, RACI, exceptions.", page: "77" },
      { n: "18", title: "Roadmap and limits", desc: "Trajectory, security, support.", page: "82" },
    ]},
    { title: "Appendices", chapters: [
      { n: "A", title: "Glossary, API, checklist", desc: "References and figure index.", page: "85" },
    ]},
  ],
  langTitle: "One manual, several languages",
  langDesc: "The public site is available in French, English, Spanish and German. The manual is written in French; teams can translate and adapt it to their country.",
  cta: "Create my association",
  ctaDesc: "The documentation is ready. So is the platform.",
  home: {
    badge: "Documentation",
    title: "The complete manual, open to everyone",
    desc: "88 pages, 10 diagrams and 24 real screenshots to understand every module and every rule.",
    cards: [
      { icon: "🔄", title: "Tontine engine", desc: "Shares, fractions, cycles, auctions, balances." },
      { icon: "🏦", title: "Loans and interest", desc: "Guarantees, schedules, pro-rata allocation." },
      { icon: "❤️", title: "Solidarity", desc: "Aid catalogue, caps, workflow." },
      { icon: "🏛️", title: "Governance", desc: "Statutes, quorums, meetings, roles." },
    ],
  },
};

const es: DocsCopy = {
  ...fr,
  nav: "Documentación",
  badge: "Documentación oficial · Edición 2026",
  title1: "El manual completo",
  title2: "de Tchoua.",
  desc: "88 páginas para comprender, configurar y explotar la plataforma: asociaciones, tontinas, cotizaciones, préstamos, solidaridad, gobernanza, informes y administración.",
  download: "Descargar el PDF",
  read: "Ver el índice",
  notice: "Edición anonimizada: los nombres de las asociaciones y de las personas fueron sustituidos por identificadores ficticios. Los montos, reglas y capturas siguen siendo concretos.",
  pages: "88 páginas", captures: "24 capturas reales", diagrams: "10 esquemas",
  version: "Versión 1.1 · Noviembre 2026", contents: "Índice",
  domainsTitle: "Todo lo que cubre el manual",
  domainsDesc: "Desde la creación de la asociación hasta el cierre del ciclo, cada pantalla y cada regla están documentadas.",
  domains: [
    { icon: "🏛️", title: "Asociaciones", desc: "Tipos, secciones, federaciones, estatutos, reglamentos y ciclo de vida." },
    { icon: "🔄", title: "Tontinas", desc: "Partes, fracciones, ciclos, subastas, beneficiarios y saldos." },
    { icon: "💳", title: "Cotizaciones", desc: "Sesiones, presencias, atrasos, multas y colación." },
    { icon: "🏦", title: "Préstamos", desc: "Solicitudes, garantías, desembolsos, reembolsos e intereses." },
    { icon: "❤️", title: "Solidaridad", desc: "Catálogo de ayudas, topes, solicitudes y pagos." },
    { icon: "📊", title: "Informes", desc: "Historial, dividendos, exportaciones PDF/CSV y auditoría." },
  ],
  parts: [
    { title: "Comprender la plataforma", chapters: [
      { n: "1", title: "Visión y posicionamiento", desc: "Promesa, personas, diferenciación.", page: "6" },
      { n: "2", title: "Arquitectura y seguridad", desc: "Stack, datos, roles, explotación.", page: "9" },
      { n: "3", title: "Cuentas y permisos", desc: "Roles de asociación y de sistema.", page: "14" },
      { n: "4", title: "Ciclo de vida", desc: "Creación, configuración, adhesión, cierre.", page: "18" },
      { n: "5", title: "Panorama de módulos", desc: "Ocho dominios, un núcleo común.", page: "24" },
    ]},
    { title: "Módulos de negocio", chapters: [
      { n: "6", title: "Tontinas y actividades", desc: "Partes, ciclos, subastas, beneficiarios.", page: "29" },
      { n: "7", title: "Cotizaciones y sesiones", desc: "Cobros, presencias, multas.", page: "36" },
      { n: "8", title: "Préstamos e intereses", desc: "Garantías, calendarios, reparto.", page: "41" },
      { n: "9", title: "Solidaridad y ayudas", desc: "Catálogo, topes, flujo.", page: "46" },
      { n: "10", title: "Reuniones y disciplina", desc: "Quórums, actas, sanciones, colación.", page: "49" },
      { n: "11", title: "Contabilidad y dividendos", desc: "Cajas, informes, reparto.", page: "52" },
      { n: "12", title: "Historial y análisis", desc: "Lista, kanban, gráfico, cuadrícula.", page: "56" },
    ]},
    { title: "Operación y casos reales", chapters: [
      { n: "13", title: "Espacio miembro y móvil", desc: "Launchpad, temas, notificaciones.", page: "60" },
      { n: "14", title: "Administración", desc: "Plantillas, usuarios, parámetros.", page: "65" },
      { n: "15", title: "Multilingüe e internacional", desc: "Idiomas, divisas, pagos.", page: "71" },
      { n: "16", title: "Casos reales anonimizados", desc: "Tres modelos, tres asociaciones.", page: "73" },
      { n: "17", title: "Flujos de extremo a extremo", desc: "Escenarios, RACI, excepciones.", page: "77" },
      { n: "18", title: "Hoja de ruta y límites", desc: "Trayectoria, seguridad, soporte.", page: "82" },
    ]},
    { title: "Anexos", chapters: [
      { n: "A", title: "Glosario, API, checklist", desc: "Referencias e índice de figuras.", page: "85" },
    ]},
  ],
  langTitle: "Un manual, varios idiomas",
  langDesc: "El sitio público está disponible en francés, inglés, español y alemán. El manual está redactado en francés; los equipos pueden traducirlo y adaptarlo a su país.",
  cta: "Crear mi asociación", ctaDesc: "La documentación está lista. La plataforma también.",
  home: {
    badge: "Documentación", title: "El manual completo, accesible para todos",
    desc: "88 páginas, 10 esquemas y 24 capturas reales para comprender cada módulo y cada regla.",
    cards: [
      { icon: "🔄", title: "Motor de tontina", desc: "Partes, fracciones, ciclos, subastas, saldos." },
      { icon: "🏦", title: "Préstamos e intereses", desc: "Garantías, calendarios, reparto proporcional." },
      { icon: "❤️", title: "Solidaridad", desc: "Catálogo de ayudas, topes, flujo." },
      { icon: "🏛️", title: "Gobernanza", desc: "Estatutos, quórums, reuniones, roles." },
    ],
  },
};

const de: DocsCopy = {
  ...fr,
  nav: "Dokumentation",
  badge: "Offizielle Dokumentation · Ausgabe 2026",
  title1: "Das vollständige Handbuch",
  title2: "für Tchoua.",
  desc: "88 Seiten zum Verstehen, Konfigurieren und Betreiben der Plattform: Vereine, Tontinen, Beiträge, Kredite, Solidarität, Governance, Berichte und Administration.",
  download: "PDF herunterladen",
  read: "Inhaltsverzeichnis ansehen",
  notice: "Anonymisierte Ausgabe: Namen von Vereinen und Personen wurden durch fiktive Kennungen ersetzt. Beträge, Regeln und Screenshots bleiben konkret.",
  pages: "88 Seiten", captures: "24 echte Screenshots", diagrams: "10 Diagramme",
  version: "Version 1.1 · November 2026", contents: "Inhalt",
  domainsTitle: "Was das Handbuch abdeckt",
  domainsDesc: "Von der Gründung des Vereins bis zum Abschluss des Zyklus werden jeder Bildschirm und jede Regel dokumentiert.",
  domains: [
    { icon: "🏛️", title: "Vereine", desc: "Typen, Sektionen, Föderationen, Satzungen, Regeln und Lebenszyklus." },
    { icon: "🔄", title: "Tontinen", desc: "Anteile, Bruchteile, Zyklen, Auktionen, Begünstigte und Salden." },
    { icon: "💳", title: "Beiträge", desc: "Sitzungen, Anwesenheit, Verspätungen, Bußgelder und Bewirtung." },
    { icon: "🏦", title: "Kredite", desc: "Anträge, Sicherheiten, Auszahlungen, Rückzahlungen und Zinsen." },
    { icon: "❤️", title: "Solidarität", desc: "Hilfskatalog, Obergrenzen, Anträge und Auszahlungen." },
    { icon: "📊", title: "Berichte", desc: "Historie, Dividenden, PDF/CSV-Exporte und Audit." },
  ],
  parts: [
    { title: "Die Plattform verstehen", chapters: [
      { n: "1", title: "Vision und Positionierung", desc: "Versprechen, Personas, Differenzierung.", page: "6" },
      { n: "2", title: "Architektur und Sicherheit", desc: "Stack, Daten, Rollen, Betrieb.", page: "9" },
      { n: "3", title: "Konten und Berechtigungen", desc: "Vereins- und Systemrollen.", page: "14" },
      { n: "4", title: "Lebenszyklus", desc: "Gründung, Konfiguration, Mitgliedschaft, Abschluss.", page: "18" },
      { n: "5", title: "Modulübersicht", desc: "Acht Bereiche, ein gemeinsamer Kern.", page: "24" },
    ]},
    { title: "Fachmodule", chapters: [
      { n: "6", title: "Tontinen und Aktivitäten", desc: "Anteile, Zyklen, Auktionen, Begünstigte.", page: "29" },
      { n: "7", title: "Beiträge und Sitzungen", desc: "Zahlungen, Anwesenheit, Bußgelder.", page: "36" },
      { n: "8", title: "Kredite und Zinsen", desc: "Sicherheiten, Pläne, Verteilung.", page: "41" },
      { n: "9", title: "Solidarität und Hilfe", desc: "Katalog, Obergrenzen, Workflow.", page: "46" },
      { n: "10", title: "Sitzungen und Disziplin", desc: "Quoren, Protokolle, Sanktionen, Bewirtung.", page: "49" },
      { n: "11", title: "Buchhaltung und Dividenden", desc: "Kassen, Berichte, Verteilung.", page: "52" },
      { n: "12", title: "Historie und Analysen", desc: "Liste, Kanban, Diagramm, Raster.", page: "56" },
    ]},
    { title: "Betrieb und Praxis", chapters: [
      { n: "13", title: "Mitgliederbereich und Mobil", desc: "Launchpad, Themes, Benachrichtigungen.", page: "60" },
      { n: "14", title: "Administration", desc: "Vorlagen, Benutzer, Einstellungen.", page: "65" },
      { n: "15", title: "Mehrsprachig und international", desc: "Sprachen, Währungen, Zahlungen.", page: "71" },
      { n: "16", title: "Anonymisierte Praxisfälle", desc: "Drei Modelle, drei Vereine.", page: "73" },
      { n: "17", title: "End-to-End-Workflows", desc: "Szenarien, RACI, Ausnahmen.", page: "77" },
      { n: "18", title: "Roadmap und Grenzen", desc: "Entwicklung, Sicherheit, Support.", page: "82" },
    ]},
    { title: "Anhänge", chapters: [
      { n: "A", title: "Glossar, API, Checkliste", desc: "Referenzen und Abbildungsverzeichnis.", page: "85" },
    ]},
  ],
  langTitle: "Ein Handbuch, mehrere Sprachen",
  langDesc: "Die öffentliche Website ist auf Französisch, Englisch, Spanisch und Deutsch verfügbar. Das Handbuch ist auf Französisch verfasst; Teams können es übersetzen und an ihr Land anpassen.",
  cta: "Meinen Verein erstellen", ctaDesc: "Die Dokumentation ist bereit. Die Plattform auch.",
  home: {
    badge: "Dokumentation", title: "Das vollständige Handbuch für alle",
    desc: "88 Seiten, 10 Diagramme und 24 echte Screenshots, um jedes Modul und jede Regel zu verstehen.",
    cards: [
      { icon: "🔄", title: "Tontinen-Motor", desc: "Anteile, Bruchteile, Zyklen, Auktionen, Salden." },
      { icon: "🏦", title: "Kredite und Zinsen", desc: "Sicherheiten, Pläne, anteilige Verteilung." },
      { icon: "❤️", title: "Solidarität", desc: "Hilfskatalog, Obergrenzen, Workflow." },
      { icon: "🏛️", title: "Governance", desc: "Satzungen, Quoren, Sitzungen, Rollen." },
    ],
  },
};

export const DOCS_COPY: Record<PublicLang, DocsCopy> = { fr, en, es, de };
