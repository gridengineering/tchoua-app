export type StudyCopy = {
  badge: string;
  title: string;
  desc: string;
  pages: string;
  domains: string;
  sheets: string;
  languages: string;
  readOnline: string;
  download: string;
  manualLabel: string;
  manualDesc: string;
  studyLabel: string;
  studyDesc: string;
  documents: string;
  highlights: { title: string; desc: string }[];
};

const fr: StudyCopy = {
  badge: "Étude de conception technique et fonctionnelle",
  title: "Tchoua Association Resource Planning",
  desc: "L’étude complète de conception : 36 domaines, 144 fiches opérationnelles, formulaires, workflows, exceptions, recettes et 23 328 combinaisons bornées. Elle définit la cible fonctionnelle et technique qui prolonge le manuel de l’existant.",
  pages: "168 pages",
  domains: "36 domaines",
  sheets: "144 fiches",
  languages: "4 langues",
  readOnline: "Lire l’étude en ligne",
  download: "Télécharger l’étude PDF",
  manualLabel: "Manuel de l’existant",
  manualDesc: "Le fonctionnement réel de la plateforme : 21 chapitres, du cadre ARP à la configuration des activités.",
  studyLabel: "Étude de conception",
  studyDesc: "La cible à réaliser : 36 domaines, 144 fiches et le référentiel des combinaisons.",
  documents: "Deux documents complémentaires",
  highlights: [
    { title: "36 domaines", desc: "Organisation, tontines, prêts, solidarité, projets, sécurité et internationalisation." },
    { title: "144 fiches", desc: "Périmètre, formulaire, workflow, exceptions, recette et indicateurs par domaine." },
    { title: "23 328 combinaisons", desc: "Catalogue borné, conditions C01–C06 et couverture de recette par paires." },
    { title: "4 langues", desc: "Étude HTML en français, anglais, espagnol et allemand, avec le PDF source." },
  ],
};

const en: StudyCopy = {
  badge: "Functional and technical design study",
  title: "Tchoua Association Resource Planning",
  desc: "The complete design study: 36 domains, 144 operational sheets, forms, workflows, exceptions, test recipes and 23,328 bounded combinations. It defines the functional and technical target that extends the existing-system manual.",
  pages: "168 pages",
  domains: "36 domains",
  sheets: "144 sheets",
  languages: "4 languages",
  readOnline: "Read the study online",
  download: "Download the study PDF",
  manualLabel: "Existing-system manual",
  manualDesc: "How the platform actually works: 21 chapters, from the ARP framework to activity configuration.",
  studyLabel: "Design study",
  studyDesc: "The target to build: 36 domains, 144 sheets and the combination reference.",
  documents: "Two complementary documents",
  highlights: [
    { title: "36 domains", desc: "Organisation, tontines, loans, solidarity, projects, security and internationalisation." },
    { title: "144 sheets", desc: "Scope, form, workflow, exceptions, test recipe and indicators for each domain." },
    { title: "23,328 combinations", desc: "Bounded catalogue, C01–C06 conditions and pairwise test coverage." },
    { title: "4 languages", desc: "HTML study in French, English, Spanish and German, with the source PDF." },
  ],
};

const es: StudyCopy = {
  badge: "Estudio de diseño funcional y técnico",
  title: "Tchoua Association Resource Planning",
  desc: "El estudio completo de diseño: 36 dominios, 144 fichas operativas, formularios, flujos, excepciones, recetas y 23 328 combinaciones acotadas. Define el objetivo funcional y técnico que prolonga el manual del sistema existente.",
  pages: "168 páginas",
  domains: "36 dominios",
  sheets: "144 fichas",
  languages: "4 idiomas",
  readOnline: "Leer el estudio en línea",
  download: "Descargar el estudio PDF",
  manualLabel: "Manual del sistema existente",
  manualDesc: "El funcionamiento real de la plataforma: 21 capítulos, del marco ARP a la configuración de actividades.",
  studyLabel: "Estudio de diseño",
  studyDesc: "El objetivo a construir: 36 dominios, 144 fichas y el referencial de combinaciones.",
  documents: "Dos documentos complementarios",
  highlights: [
    { title: "36 dominios", desc: "Organización, tontinas, préstamos, solidaridad, proyectos, seguridad e internacionalización." },
    { title: "144 fichas", desc: "Alcance, formulario, flujo, excepciones, receta e indicadores por dominio." },
    { title: "23 328 combinaciones", desc: "Catálogo acotado, condiciones C01–C06 y cobertura de pruebas por pares." },
    { title: "4 idiomas", desc: "Estudio HTML en francés, inglés, español y alemán, con el PDF fuente." },
  ],
};

const de: StudyCopy = {
  badge: "Funktionale und technische Designstudie",
  title: "Tchoua Association Resource Planning",
  desc: "Die vollständige Designstudie: 36 Domänen, 144 operative Steckbriefe, Formulare, Workflows, Ausnahmen, Testrezepte und 23 328 begrenzte Kombinationen. Sie definiert das funktionale und technische Ziel, das das Handbuch des bestehenden Systems erweitert.",
  pages: "168 Seiten",
  domains: "36 Domänen",
  sheets: "144 Steckbriefe",
  languages: "4 Sprachen",
  readOnline: "Studie online lesen",
  download: "Studie als PDF herunterladen",
  manualLabel: "Handbuch des bestehenden Systems",
  manualDesc: "So funktioniert die Plattform tatsächlich: 21 Kapitel, vom ARP-Rahmen bis zur Aktivitätenkonfiguration.",
  studyLabel: "Designstudie",
  studyDesc: "Das zu realisierende Ziel: 36 Domänen, 144 Steckbriefe und der Kombinationskatalog.",
  documents: "Zwei ergänzende Dokumente",
  highlights: [
    { title: "36 Domänen", desc: "Organisation, Tontinen, Kredite, Solidarität, Projekte, Sicherheit und Internationalisierung." },
    { title: "144 Steckbriefe", desc: "Umfang, Formular, Workflow, Ausnahmen, Testrezept und Kennzahlen je Domäne." },
    { title: "23 328 Kombinationen", desc: "Begrenzter Katalog, Bedingungen C01–C06 und paarweise Testabdeckung." },
    { title: "4 Sprachen", desc: "HTML-Studie auf Französisch, Englisch, Spanisch und Deutsch, mit Quell-PDF." },
  ],
};

export const STUDY_COPY: Record<string, StudyCopy> = { fr, en, es, de };
