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
  readOnline: string;
  read: string;
  notice: string;
  pages: string;
  captures: string;
  diagrams: string;
  version: string;
  contents: string;
  chaptersWord: string;
  annexWord: string;
  chWord: string;
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
  desc: "109 pages pour comprendre, paramétrer et exploiter la plateforme : associations, tontines, cotisations, prêts, solidarité, gouvernance, rapports et administration.",
  download: "Télécharger le PDF",
  readOnline: "Lire en ligne",
  read: "Parcourir le sommaire",
  notice: "Édition anonymisée : les noms des associations et des personnes ont été remplacés par des identifiants fictifs. Les montants, règles et captures restent concrets.",
  pages: "109 pages",
  captures: "39 captures réelles",
  diagrams: "10 schémas",
  version: "Version 2.0 · Novembre 2026",
  contents: "Sommaire",
  chaptersWord: "chapitres",
  annexWord: "annexes",
  chWord: "ch.",
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
        { n: "1", title: "Vision et positionnement", desc: "Promesse, personas, différenciation.", page: "7" },
        { n: "2", title: "Architecture et sécurité", desc: "Stack, données, rôles, exploitation.", page: "10" },
        { n: "3", title: "Comptes et permissions", desc: "Rôles d'association et rôles système.", page: "15" },
        { n: "4", title: "Cycle de vie", desc: "Création, configuration, adhésion, clôture.", page: "19" },
        { n: "5", title: "Panorama des modules", desc: "Huit domaines, un noyau commun.", page: "25" },
      ],
    },
    {
      title: "Modules métier",
      chapters: [
        { n: "6", title: "Tontines et activités", desc: "Parts, cycles, enchères, bénéficiaires.", page: "30" },
        { n: "7", title: "Cotisations et sessions", desc: "Encaissements, présences, amendes.", page: "37" },
        { n: "8", title: "Prêts et intérêts", desc: "Garanties, échéances, répartition.", page: "42" },
        { n: "9", title: "Solidarité et aides", desc: "Catalogue, plafonds, workflow.", page: "47" },
        { n: "10", title: "Réunions et discipline", desc: "Quorums, PV, sanctions, collation.", page: "50" },
        { n: "11", title: "Comptabilité et dividendes", desc: "Caisses, rapports, répartition.", page: "53" },
        { n: "12", title: "Historique et analyses", desc: "Liste, kanban, graphique, grille.", page: "57" },
      ],
    },
    {
      title: "Exploitation et cas réels",
      chapters: [
        { n: "13", title: "Espace membre et mobile", desc: "Launchpad, thèmes, notifications.", page: "61" },
        { n: "14", title: "Administration", desc: "Modèles, utilisateurs, paramètres.", page: "66" },
        { n: "15", title: "Multilingue et international", desc: "Langues, devises, paiements.", page: "72" },
        { n: "16", title: "Cas réels anonymisés", desc: "Trois modèles, trois associations.", page: "74" },
        { n: "17", title: "Workflows de bout en bout", desc: "Scénarios, RACI, exceptions.", page: "78" },
        { n: "18", title: "Roadmap et limites", desc: "Trajectoire, sécurité, support.", page: "83" },
      ],
    },
    {
      title: "Cadre ARP et configuration",
      chapters: [
        { n: "19", title: "Cadre ARP : règles et versions", desc: "Dimensions, conditions, fonds, versions.", page: "86" },
        { n: "20", title: "Création par onglets", desc: "Huit onglets, navigation libre, permissions.", page: "94" },
        { n: "21", title: "Configuration des activités", desc: "Tontines, prêts, cotisations, fonds.", page: "99" },
      ],
    },
    {
      title: "Annexes",
      chapters: [
        { n: "A", title: "Glossaire, API, checklist", desc: "Références et index des figures.", page: "105" },
      ],
    },
  ],
  langTitle: "Un manuel, plusieurs langues",
  langDesc: "Le site public est disponible en français, anglais, espagnol et allemand. Le manuel reprend la même structure et les mêmes captures dans les quatre langues.",
  cta: "Créer mon association",
  ctaDesc: "La documentation est prête. La plateforme aussi.",
  home: {
    badge: "Documentation",
    title: "Le manuel complet, accessible à tous",
    desc: "109 pages, 10 schémas et 39 captures réelles pour comprendre chaque module et chaque règle.",
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
  desc: "104 pages to understand, configure and operate the platform: associations, tontines, contributions, loans, solidarity, governance, reports and administration.",
  download: "Download the PDF",
  readOnline: "Read online",
  read: "Browse the contents",
  notice: "Anonymized edition: association and people names have been replaced with fictional identifiers. Amounts, rules and screenshots remain concrete.",
  pages: "104 pages",
  captures: "39 real screenshots",
  diagrams: "10 diagrams",
  version: "Version 2.0 · November 2026",
  contents: "Contents",
  chaptersWord: "chapters",
  annexWord: "appendices",
  chWord: "ch.",
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
      { n: "1", title: "Vision and positioning", desc: "Promise, personas, differentiation.", page: "4" },
      { n: "2", title: "Architecture and security", desc: "Stack, data, roles, operations.", page: "7" },
      { n: "3", title: "Accounts and permissions", desc: "Association and system roles.", page: "12" },
      { n: "4", title: "Lifecycle", desc: "Creation, configuration, membership, closure.", page: "16" },
      { n: "5", title: "Module overview", desc: "Eight domains, one shared core.", page: "22" },
    ]},
    { title: "Business modules", chapters: [
      { n: "6", title: "Tontines and activities", desc: "Shares, cycles, auctions, beneficiaries.", page: "27" },
      { n: "7", title: "Contributions and sessions", desc: "Payments, attendance, fines.", page: "34" },
      { n: "8", title: "Loans and interest", desc: "Guarantees, schedules, allocation.", page: "39" },
      { n: "9", title: "Solidarity and aid", desc: "Catalogue, caps, workflow.", page: "44" },
      { n: "10", title: "Meetings and discipline", desc: "Quorums, minutes, sanctions, catering.", page: "47" },
      { n: "11", title: "Accounting and dividends", desc: "Funds, reports, distribution.", page: "50" },
      { n: "12", title: "History and analytics", desc: "List, kanban, chart, grid.", page: "54" },
    ]},
    { title: "Operations and real cases", chapters: [
      { n: "13", title: "Member area and mobile", desc: "Launchpad, themes, notifications.", page: "57" },
      { n: "14", title: "Administration", desc: "Templates, users, settings.", page: "62" },
      { n: "15", title: "Multilingual and international", desc: "Languages, currencies, payments.", page: "68" },
      { n: "16", title: "Anonymized real cases", desc: "Three models, three associations.", page: "70" },
      { n: "17", title: "End-to-end workflows", desc: "Scenarios, RACI, exceptions.", page: "74" },
      { n: "18", title: "Roadmap and limits", desc: "Trajectory, security, support.", page: "79" },
    ]},
    { title: "ARP framework and configuration", chapters: [
      { n: "19", title: "ARP framework: rules and versions", desc: "Dimensions, conditions, funds, versions.", page: "82" },
      { n: "20", title: "Tabbed creation", desc: "Eight tabs, free navigation, permissions.", page: "89" },
      { n: "21", title: "Activity configuration", desc: "Tontines, loans, contributions, funds.", page: "94" },
    ]},
    { title: "Appendices", chapters: [
      { n: "A", title: "Glossary, API, checklist", desc: "References and figure index.", page: "100" },
    ]},
  ],
  langTitle: "One manual, several languages",
  langDesc: "The public site is available in French, English, Spanish and German. The manual is available in French, English, Spanish and German, with the same structure and screenshots.",
  cta: "Create my association",
  ctaDesc: "The documentation is ready. So is the platform.",
  home: {
    badge: "Documentation",
    title: "The complete manual, open to everyone",
    desc: "104 pages, 10 diagrams and 39 real screenshots to understand every module and every rule.",
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
  desc: "105 páginas para comprender, configurar y explotar la plataforma: asociaciones, tontinas, cotizaciones, préstamos, solidaridad, gobernanza, informes y administración.",
  download: "Descargar el PDF",
  readOnline: "Leer en línea",
  read: "Ver el índice",
  notice: "Edición anonimizada: los nombres de las asociaciones y de las personas fueron sustituidos por identificadores ficticios. Los montos, reglas y capturas siguen siendo concretos.",
  pages: "105 páginas", captures: "39 capturas reales", diagrams: "10 esquemas",
  version: "Versión 2.0 · Noviembre 2026", contents: "Índice", chaptersWord: "capítulos", annexWord: "anexos", chWord: "cap.",
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
      { n: "1", title: "Visión y posicionamiento", desc: "Promesa, personas, diferenciación.", page: "4" },
      { n: "2", title: "Arquitectura y seguridad", desc: "Stack, datos, roles, explotación.", page: "7" },
      { n: "3", title: "Cuentas y permisos", desc: "Roles de asociación y de sistema.", page: "12" },
      { n: "4", title: "Ciclo de vida", desc: "Creación, configuración, adhesión, cierre.", page: "16" },
      { n: "5", title: "Panorama de módulos", desc: "Ocho dominios, un núcleo común.", page: "22" },
    ]},
    { title: "Módulos de negocio", chapters: [
      { n: "6", title: "Tontinas y actividades", desc: "Partes, ciclos, subastas, beneficiarios.", page: "27" },
      { n: "7", title: "Cotizaciones y sesiones", desc: "Cobros, presencias, multas.", page: "34" },
      { n: "8", title: "Préstamos e intereses", desc: "Garantías, calendarios, reparto.", page: "39" },
      { n: "9", title: "Solidaridad y ayudas", desc: "Catálogo, topes, flujo.", page: "44" },
      { n: "10", title: "Reuniones y disciplina", desc: "Quórums, actas, sanciones, colación.", page: "47" },
      { n: "11", title: "Contabilidad y dividendos", desc: "Cajas, informes, reparto.", page: "50" },
      { n: "12", title: "Historial y análisis", desc: "Lista, kanban, gráfico, cuadrícula.", page: "54" },
    ]},
    { title: "Operación y casos reales", chapters: [
      { n: "13", title: "Espacio miembro y móvil", desc: "Launchpad, temas, notificaciones.", page: "57" },
      { n: "14", title: "Administración", desc: "Plantillas, usuarios, parámetros.", page: "62" },
      { n: "15", title: "Multilingüe e internacional", desc: "Idiomas, divisas, pagos.", page: "68" },
      { n: "16", title: "Casos reales anonimizados", desc: "Tres modelos, tres asociaciones.", page: "70" },
      { n: "17", title: "Flujos de extremo a extremo", desc: "Escenarios, RACI, excepciones.", page: "74" },
      { n: "18", title: "Hoja de ruta y límites", desc: "Trayectoria, seguridad, soporte.", page: "79" },
    ]},
    { title: "Marco ARP y configuración", chapters: [
      { n: "19", title: "Marco ARP: reglas y versiones", desc: "Dimensiones, condiciones, fondos, versiones.", page: "82" },
      { n: "20", title: "Creación por pestañas", desc: "Ocho pestañas, navegación libre, permisos.", page: "90" },
      { n: "21", title: "Configuración de actividades", desc: "Tontinas, préstamos, cotizaciones, fondos.", page: "95" },
    ]},
    { title: "Anexos", chapters: [
      { n: "A", title: "Glosario, API, checklist", desc: "Referencias e índice de figuras.", page: "101" },
    ]},
  ],
  langTitle: "Un manual, varios idiomas",
  langDesc: "El sitio público está disponible en francés, inglés, español y alemán. El manual está disponible en francés, inglés, español y alemán, con la misma estructura y capturas.",
  cta: "Crear mi asociación", ctaDesc: "La documentación está lista. La plataforma también.",
  home: {
    badge: "Documentación", title: "El manual completo, accesible para todos",
    desc: "105 páginas, 10 esquemas y 39 capturas reales para comprender cada módulo y cada regla.",
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
  desc: "107 Seiten zum Verstehen, Konfigurieren und Betreiben der Plattform: Vereine, Tontinen, Beiträge, Kredite, Solidarität, Governance, Berichte und Administration.",
  download: "PDF herunterladen",
  readOnline: "Online lesen",
  read: "Inhaltsverzeichnis ansehen",
  notice: "Anonymisierte Ausgabe: Namen von Vereinen und Personen wurden durch fiktive Kennungen ersetzt. Beträge, Regeln und Screenshots bleiben konkret.",
  pages: "107 Seiten", captures: "39 echte Screenshots", diagrams: "10 Diagramme",
  version: "Version 2.0 · November 2026", contents: "Inhalt", chaptersWord: "Kapitel", annexWord: "Anhänge", chWord: "Kap.",
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
      { n: "1", title: "Vision und Positionierung", desc: "Versprechen, Personas, Differenzierung.", page: "4" },
      { n: "2", title: "Architektur und Sicherheit", desc: "Stack, Daten, Rollen, Betrieb.", page: "7" },
      { n: "3", title: "Konten und Berechtigungen", desc: "Vereins- und Systemrollen.", page: "12" },
      { n: "4", title: "Lebenszyklus", desc: "Gründung, Konfiguration, Mitgliedschaft, Abschluss.", page: "16" },
      { n: "5", title: "Modulübersicht", desc: "Acht Bereiche, ein gemeinsamer Kern.", page: "22" },
    ]},
    { title: "Fachmodule", chapters: [
      { n: "6", title: "Tontinen und Aktivitäten", desc: "Anteile, Zyklen, Auktionen, Begünstigte.", page: "27" },
      { n: "7", title: "Beiträge und Sitzungen", desc: "Zahlungen, Anwesenheit, Bußgelder.", page: "35" },
      { n: "8", title: "Kredite und Zinsen", desc: "Sicherheiten, Pläne, Verteilung.", page: "40" },
      { n: "9", title: "Solidarität und Hilfe", desc: "Katalog, Obergrenzen, Workflow.", page: "45" },
      { n: "10", title: "Sitzungen und Disziplin", desc: "Quoren, Protokolle, Sanktionen, Bewirtung.", page: "48" },
      { n: "11", title: "Buchhaltung und Dividenden", desc: "Kassen, Berichte, Verteilung.", page: "51" },
      { n: "12", title: "Historie und Analysen", desc: "Liste, Kanban, Diagramm, Raster.", page: "55" },
    ]},
    { title: "Betrieb und Praxis", chapters: [
      { n: "13", title: "Mitgliederbereich und Mobil", desc: "Launchpad, Themes, Benachrichtigungen.", page: "59" },
      { n: "14", title: "Administration", desc: "Vorlagen, Benutzer, Einstellungen.", page: "64" },
      { n: "15", title: "Mehrsprachig und international", desc: "Sprachen, Währungen, Zahlungen.", page: "70" },
      { n: "16", title: "Anonymisierte Praxisfälle", desc: "Drei Modelle, drei Vereine.", page: "72" },
      { n: "17", title: "End-to-End-Workflows", desc: "Szenarien, RACI, Ausnahmen.", page: "76" },
      { n: "18", title: "Roadmap und Grenzen", desc: "Entwicklung, Sicherheit, Support.", page: "81" },
    ]},
    { title: "ARP-Rahmen und Konfiguration", chapters: [
      { n: "19", title: "ARP-Rahmen: Regeln und Versionen", desc: "Dimensionen, Bedingungen, Fonds, Versionen.", page: "84" },
      { n: "20", title: "Erstellung mit Registerkarten", desc: "Acht Register, freie Navigation, Berechtigungen.", page: "92" },
      { n: "21", title: "Aktivitäten konfigurieren", desc: "Tontinen, Kredite, Beiträge, Fonds.", page: "97" },
    ]},
    { title: "Anhänge", chapters: [
      { n: "A", title: "Glossar, API, Checkliste", desc: "Referenzen und Abbildungsverzeichnis.", page: "103" },
    ]},
  ],
  langTitle: "Ein Handbuch, mehrere Sprachen",
  langDesc: "Die öffentliche Website ist auf Französisch, Englisch, Spanisch und Deutsch verfügbar. Das Handbuch ist auf Französisch, Englisch, Spanisch und Deutsch verfügbar, mit derselben Struktur und denselben Screenshots.",
  cta: "Meinen Verein erstellen", ctaDesc: "Die Dokumentation ist bereit. Die Plattform auch.",
  home: {
    badge: "Dokumentation", title: "Das vollständige Handbuch für alle",
    desc: "107 Seiten, 10 Diagramme und 39 echte Screenshots, um jedes Modul und jede Regel zu verstehen.",
    cards: [
      { icon: "🔄", title: "Tontinen-Motor", desc: "Anteile, Bruchteile, Zyklen, Auktionen, Salden." },
      { icon: "🏦", title: "Kredite und Zinsen", desc: "Sicherheiten, Pläne, anteilige Verteilung." },
      { icon: "❤️", title: "Solidarität", desc: "Hilfskatalog, Obergrenzen, Workflow." },
      { icon: "🏛️", title: "Governance", desc: "Satzungen, Quoren, Sitzungen, Rollen." },
    ],
  },
};

export const DOCS_COPY: Record<PublicLang, DocsCopy> = { fr, en, es, de };
