export type PublicLang = "fr" | "en" | "es" | "de";

type Item = { title: string; desc: string; tags?: string[] };
type FeatureGroup = { category: string; items: string[] };

export type HomeCopy = {
  hero: { badge: string; title1: string; title2: string; desc: string; cta1: string; cta2: string; social: string; ledger: string; rows: { label: string; amount: string }[]; vote: string; repayment: string; members: string };
  stats: { value: string; label: string }[];
  tontines: { badge: string; title1: string; title2: string; desc: string; items: Item[] };
  places: { title: string; desc: string; items: { title: string; desc: string; features: string[] }[] };
  steps: { badge: string; title: string; desc: string; step: string; items: Item[] };
  engagement: { badge: string; title: string; desc: string; cta: string; table: string; levels: { name: string; pts: string }[] };
  testimonials: { badge: string; title: string; items: { text: string; name: string; initials: string; role: string }[] };
  modules: { badge: string; title1: string; title2: string; desc: string; items: Item[] };
  pricing: { badge: string; title1: string; title2: string; desc: string; plan: string; price: string; sub: string; perks: string[]; included: string; groups: FeatureGroup[]; free: string; github: string; soon: string };
  finalCta: { title1: string; title2: string; desc: string; cta1: string; cta2: string };
  footer: { about: string; product: string; resources: string; company: string; legal: string; modules: string; pricing: string; security: string; api: string; how: string; help: string; aboutLink: string; contact: string; privacy: string; terms: string; cookies: string; rights: string };
};

const fr: HomeCopy = {
  hero: {
    badge: "ERP Tontine Open Source — 100% Gratuit",
    title1: "La Solidarité,", title2: "Digitalisée.",
    desc: "Tchoua transforme votre tontine traditionnelle en un système numérique complet — transparence totale, cotisations multi-supports, prêts et solidarité.",
    cta1: "Commencer gratuitement", cta2: "Voir la démo", social: "4,9/5 · 2 500+ membres actifs",
    ledger: "Grand livre", rows: [
      { label: "Cotisation M.", amount: "+50 000" },
      { label: "Fonds d'urgence", amount: "+5 000" },
      { label: "Prêt accordé", amount: "-100 000" },
      { label: "Remboursement", amount: "+18 500" },
    ],
    vote: "Assemblée : vote investissement terrain — 6/10", repayment: "Taux de remboursement", members: "Membres actifs",
  },
  stats: [
    { value: "2 500+", label: "Membres" },
    { value: "180+", label: "Tontines" },
    { value: "850M+", label: "FCFA gérés" },
    { value: "4", label: "Pays" },
  ],
  tontines: {
    badge: "Fonctionnalités", title1: "Une tontine.", title2: "Tous les types.",
    desc: "Cotisations en espèces, en nature ou solidarité : Tchoua s'adapte à chaque tradition.",
    items: [
      { title: "Cotisations espèces & nature", desc: "MTN MoMo, Orange Money, Wave, espèces, maïs, macabo, huile de palme — tous les modes de cotisation acceptés.", tags: ["ROSCA", "ASCA", "Multi-devises"] },
      { title: "Contributions en nature", desc: "Gérez les apports non monétaires avec conversion automatique et suivi de la qualité des contributions.", tags: ["Tontine nature", "Coopérative", "Agriculture"] },
      { title: "Solidarité & services", desc: "Fonds d'urgence, soutien naissance, mariage, deuil, échanges de services et de compétences communautaires.", tags: ["Entraide", "Urgence", "Culture"] },
    ],
  },
  places: {
    title: "Chaque tontine a sa place",
    desc: "Financière, naturelle ou culturelle — chaque pratique traditionnelle trouve son écrin numérique.",
    items: [
      { title: "Financière", desc: "ROSCA et ASCA avec tours de tirage, prêts internes et microfinance communautaire.", features: ["Tours de tirage automatiques", "Prêts avec intérêts", "Rapports OHADA", "Paiements mobiles"] },
      { title: "En nature", desc: "Contributions en produits agricoles avec système de valorisation et d'échange.", features: ["Conversion unités/valeur", "Contrôle qualité", "Marketplace intégré", "Coopérative agricole"] },
      { title: "Services & compétences", desc: "Échangez des heures de travail, expertises professionnelles et services domestiques.", features: ["Banque de temps", "Profils de compétences", "Évaluation des échanges", "Contrats de service"] },
    ],
  },
  steps: {
    badge: "Simplicité", title: "Ensemble, en trois gestes", desc: "De la création à la distribution, tout se fait en quelques clics.", step: "Étape",
    items: [
      { title: "Créez votre groupe", desc: "Configurez votre tontine en quelques minutes — type, montant, fréquence, règles et membres." },
      { title: "Cotisez à votre rythme", desc: "Mobile Money, espèces ou nature — chaque cotisation est enregistrée et confirmée en temps réel." },
      { title: "Distribuez équitablement", desc: "Tirage aléatoire ou par ordre : chaque bénéficiaire reçoit son dû en toute transparence." },
    ],
  },
  engagement: {
    badge: "Engagement", title: "Valorisez chaque engagement",
    desc: "Points, badges et niveaux récompensent la fiabilité, la solidarité et l'implication communautaire de chaque membre.",
    cta: "Voir mon score", table: "Tableau de progression",
    levels: [{ name: "Novice", pts: "0-99" }, { name: "Actif", pts: "100-299" }, { name: "Engagé", pts: "300-599" }, { name: "Leader", pts: "600-999" }, { name: "Légende", pts: "1000+" }],
  },
  testimonials: {
    badge: "Communauté", title: "La voix des communautés",
    items: [
      { text: "Depuis que nous utilisons Tchoua, notre tontine est beaucoup plus transparente. Chaque membre peut voir les transactions en temps réel.", name: "Marie Ngono", initials: "MN", role: "Présidente, Tontine Femmes Entrepreneurs, Yaoundé" },
      { text: "J'ai pu obtenir un micro-prêt en 48 h grâce à mon bon score Tchoua. La plateforme a vraiment changé notre façon de fonctionner.", name: "Jean-Baptiste Nkomo", initials: "JN", role: "Membre, Coopérative agricole, Bafoussam" },
      { text: "La gestion des contributions en maïs et café est maintenant simple et précise. Tout le monde fait confiance au système.", name: "Alice Mballa", initials: "AM", role: "Secrétaire, Entraide Famille Mballa, Douala" },
    ],
  },
  modules: {
    badge: "Fonctionnalités", title1: "18 modules.", title2: "Un écosystème complet.",
    desc: "Tchoua ne remplace pas la tontine traditionnelle — il lui donne des ailes numériques.",
    items: [
      { title: "Cotisations", desc: "Espèces & nature multi-supports" }, { title: "Sessions & tirage", desc: "ROSCA et bénéficiaires" },
      { title: "Prêts & crédit", desc: "Microfinance interne" }, { title: "Solidarité", desc: "Aide sociale et urgences" },
      { title: "Épargne", desc: "Objectifs et projections" }, { title: "Marketplace", desc: "Achats groupés & commerce" },
      { title: "Événements", desc: "Culture & assemblées" }, { title: "Chat de groupe", desc: "Messagerie par tontine" },
      { title: "Conseils IA", desc: "Conseiller financier local" }, { title: "Rapports", desc: "Analytique & export CSV" },
      { title: "Calendrier", desc: "Vue unifiée multi-tontines" }, { title: "Notifications", desc: "Push, SMS, e-mail" },
      { title: "Grand livre", desc: "Comptabilité OHADA" }, { title: "Scoring", desc: "Gamification & badges" },
      { title: "Nature", desc: "Gestion des tontines nature" }, { title: "Membres", desc: "Profils & rôles" },
      { title: "Paramètres", desc: "Configuration avancée" }, { title: "Modèles d'association", desc: "Bibliothèque (AMSED, NDI…)" },
      { title: "Multi-pays", desc: "CEMAC & diaspora" },
    ],
  },
  pricing: {
    badge: "Tarifs", title1: "Gratuit & open source.", title2: "Pour toujours.",
    desc: "Tchoua est 100 % gratuit et open source (MIT/Apache 2.0). Toutes les fonctionnalités sont incluses, sans limite, sans carte bancaire, pour toujours.",
    plan: "Gratuit", price: "0 FCFA", sub: "Pour toujours · Sans carte bancaire · Auto-hébergeable",
    perks: ["18 modules inclus", "Membres illimités", "Tontines illimitées", "Code source ouvert"],
    included: "Toutes les fonctionnalités incluses",
    groups: [
      { category: "Gestion de tontines", items: ["Tontines illimitées (ROSCA, ASCA, nature, services, solidarité, hybride)", "Membres illimités par tontine", "Fréquences flexibles (1er samedi, après le 5, jour fixe, hebdo…)", "Parts configurables + reliquat en caisse", "Plusieurs bénéficiaires par séance", "Modes d'attribution : montant fixe ou % de la cagnotte"] },
      { category: "Cotisations & paiements", items: ["Cotisations espèces multi-devises (FCFA, XAF…)", "Cotisations en nature (maïs, huile, café…)", "Échanges de services et compétences", "MTN MoMo, Orange Money, Wave, Express Union, espèces", "Suivi des retards et pénalités"] },
      { category: "Caisse & microfinance", items: ["Caisse automatique (reliquat cumulé)", "Prêts sur caisse avec taux d'intérêt mensuel", "Remboursement obligatoire à la séance suivante", "Prêts internes avec approbation et suivi", "Tableau d'amortissement automatique", "Grand livre partagé (norme OHADA)"] },
      { category: "Solidarité & aide", items: ["Fonds d'urgence (maladie, accident, décès)", "Aide naissance, mariage, scolarité", "Vote démocratique sur les décisions", "Assemblée générale virtuelle"] },
      { category: "Épargne & investissement", items: ["Objectifs d'épargne avec projections", "Investissements collectifs", "Suivi multi-tontines"] },
      { category: "Marketplace & événements", items: ["Marketplace communautaire", "Achats groupés avec prix de gros", "Événements culturels & assemblées", "Calendrier fusionné multi-tontines"] },
      { category: "Communication & IA", items: ["Chat de groupe par tontine (temps réel)", "Canaux publics & restreints", "Conseiller financier IA (local, sans API externe)", "Notifications intelligentes (push, e-mail)"] },
      { category: "Rapports & scoring", items: ["Rapports individuels & croisés multi-tontines", "Export CSV", "Scoring & gamification (5 niveaux)", "Badges et récompenses", "Piste d'audit complète"] },
      { category: "Technique & accès", items: ["Interface multilingue (FR, EN, ES, DE + extensible)", "Application mobile Android & iOS (Expo/React Native)", "API REST complète", "Open source MIT/Apache 2.0", "Auto-hébergeable (SQLite/PostgreSQL)"] },
    ],
    free: "Commencer gratuitement", github: "GitHub — code source", soon: "Voir la démo",
  },
  finalCta: { title1: "Prêt à amplifier", title2: "votre tontine ?", desc: "Rejoignez 2 500+ membres qui digitalisent leur solidarité avec Tchoua.", cta1: "Créer mon groupe", cta2: "Voir la démo" },
  footer: {
    about: "L'ERP des tontines africaines. Digitaliser la solidarité traditionnelle avec les outils de demain.",
    product: "Produit", resources: "Ressources", company: "Entreprise", legal: "Légal",
    modules: "Modules", pricing: "Tarifs", security: "Sécurité", api: "API développeurs",
    how: "Comment ça marche", help: "Aide & support", aboutLink: "À propos", contact: "Contact",
    privacy: "Confidentialité", terms: "Conditions", cookies: "Cookies", rights: "Tous droits réservés.",
  },
};

const en: HomeCopy = {
  hero: {
    badge: "Open-source tontine ERP — 100% free",
    title1: "Solidarity,", title2: "Digitized.",
    desc: "Tchoua turns your traditional tontine into a complete digital system — full transparency, multi-channel contributions, loans and solidarity.",
    cta1: "Start for free", cta2: "View demo", social: "4.9/5 · 2,500+ active members",
    ledger: "Ledger", rows: [
      { label: "Member contribution", amount: "+50,000" }, { label: "Emergency fund", amount: "+5,000" },
      { label: "Loan granted", amount: "-100,000" }, { label: "Repayment", amount: "+18,500" },
    ],
    vote: "Assembly: land investment vote — 6/10", repayment: "Repayment rate", members: "Active members",
  },
  stats: [
    { value: "2,500+", label: "Members" }, { value: "180+", label: "Tontines" },
    { value: "850M+", label: "FCFA managed" }, { value: "4", label: "Countries" },
  ],
  tontines: {
    badge: "Features", title1: "One tontine.", title2: "Every type.",
    desc: "Cash contributions, in-kind or solidarity: Tchoua adapts to every tradition.",
    items: [
      { title: "Cash & in-kind contributions", desc: "MTN MoMo, Orange Money, Wave, cash, maize, macabo, palm oil — every contribution method supported.", tags: ["ROSCA", "ASCA", "Multi-currency"] },
      { title: "In-kind contributions", desc: "Manage non-cash contributions with automatic conversion and quality tracking.", tags: ["Nature tontine", "Cooperative", "Agriculture"] },
      { title: "Solidarity & services", desc: "Emergency funds, birth, marriage and bereavement support, plus community service exchanges.", tags: ["Mutual aid", "Emergency", "Culture"] },
    ],
  },
  places: {
    title: "Every tontine has its place",
    desc: "Financial, natural or cultural — every traditional practice gets its digital home.",
    items: [
      { title: "Financial", desc: "ROSCA and ASCA with draw rotations, internal loans and community microfinance.", features: ["Automatic draw rotations", "Interest-bearing loans", "OHADA reports", "Mobile payments"] },
      { title: "In kind", desc: "Agricultural product contributions with valuation and exchange.", features: ["Unit/value conversion", "Quality control", "Built-in marketplace", "Agricultural cooperative"] },
      { title: "Services & skills", desc: "Exchange work hours, professional expertise and household services.", features: ["Time bank", "Skills profiles", "Exchange ratings", "Service contracts"] },
    ],
  },
  steps: {
    badge: "Simplicity", title: "Together, in three steps", desc: "From creation to distribution, everything takes a few clicks.", step: "Step",
    items: [
      { title: "Create your group", desc: "Set up your tontine in minutes — type, amount, frequency, rules and members." },
      { title: "Contribute at your pace", desc: "Mobile Money, cash or in-kind — every contribution is recorded and confirmed in real time." },
      { title: "Distribute fairly", desc: "Random or ordered draw: every beneficiary receives their due transparently." },
    ],
  },
  engagement: {
    badge: "Engagement", title: "Reward every commitment",
    desc: "Points, badges and levels reward reliability, solidarity and community involvement.",
    cta: "See my score", table: "Progress board",
    levels: [{ name: "Novice", pts: "0-99" }, { name: "Active", pts: "100-299" }, { name: "Committed", pts: "300-599" }, { name: "Leader", pts: "600-999" }, { name: "Legend", pts: "1000+" }],
  },
  testimonials: {
    badge: "Community", title: "Voices from our communities",
    items: [
      { text: "Since we started using Tchoua, our tontine is far more transparent. Every member can see transactions in real time.", name: "Marie Ngono", initials: "MN", role: "President, Women Entrepreneurs Tontine, Yaoundé" },
      { text: "I got a micro-loan in 48 hours thanks to my good Tchoua score. The platform has really changed the way we work.", name: "Jean-Baptiste Nkomo", initials: "JN", role: "Member, Agricultural Cooperative, Bafoussam" },
      { text: "Managing maize and coffee contributions is now simple and accurate. Everyone trusts the system.", name: "Alice Mballa", initials: "AM", role: "Secretary, Mballa Family Mutual Aid, Douala" },
    ],
  },
  modules: {
    badge: "Features", title1: "18 modules.", title2: "One complete ecosystem.",
    desc: "Tchoua doesn't replace the traditional tontine — it gives it digital wings.",
    items: [
      { title: "Contributions", desc: "Cash & in-kind, multi-channel" }, { title: "Sessions & draws", desc: "ROSCA and beneficiaries" },
      { title: "Loans & credit", desc: "Internal microfinance" }, { title: "Solidarity", desc: "Social aid and emergencies" },
      { title: "Savings", desc: "Goals and projections" }, { title: "Marketplace", desc: "Group buying & commerce" },
      { title: "Events", desc: "Culture & assemblies" }, { title: "Group chat", desc: "Per-tontine messaging" },
      { title: "AI advisor", desc: "Local financial advisor" }, { title: "Reports", desc: "Analytics & CSV export" },
      { title: "Calendar", desc: "Unified multi-tontine view" }, { title: "Notifications", desc: "Push, SMS, email" },
      { title: "Ledger", desc: "OHADA accounting" }, { title: "Scoring", desc: "Gamification & badges" },
      { title: "Nature", desc: "In-kind tontine management" }, { title: "Members", desc: "Profiles & roles" },
      { title: "Settings", desc: "Advanced configuration" }, { title: "Association templates", desc: "Library (AMSED, NDI…)" },
      { title: "Multi-country", desc: "CEMAC & diaspora" },
    ],
  },
  pricing: {
    badge: "Pricing", title1: "Free & open source.", title2: "Forever.",
    desc: "Tchoua is 100% free and open source (MIT/Apache 2.0). Every feature is included, with no limits, no credit card, forever.",
    plan: "Free", price: "0 FCFA", sub: "Forever · No credit card · Self-hostable",
    perks: ["18 modules included", "Unlimited members", "Unlimited tontines", "Open source"],
    included: "Every feature included",
    groups: [
      { category: "Tontine management", items: ["Unlimited tontines (ROSCA, ASCA, nature, services, solidarity, hybrid)", "Unlimited members per tontine", "Flexible frequencies (1st Saturday, after the 5th, fixed day, weekly…)", "Configurable shares + remainder in treasury", "Multiple beneficiaries per session", "Allocation modes: fixed amount or % of the pot"] },
      { category: "Contributions & payments", items: ["Multi-currency cash contributions (FCFA, XAF…)", "In-kind contributions (maize, oil, coffee…)", "Service and skill exchanges", "MTN MoMo, Orange Money, Wave, Express Union, cash", "Late tracking and penalties"] },
      { category: "Treasury & microfinance", items: ["Automatic treasury (cumulative remainder)", "Treasury loans with monthly interest", "Mandatory repayment at the next session", "Internal loans with approval and tracking", "Automatic amortization schedule", "Shared ledger (OHADA standard)"] },
      { category: "Solidarity & aid", items: ["Emergency fund (illness, accident, death)", "Birth, marriage and school support", "Democratic voting on decisions", "Virtual general assembly"] },
      { category: "Savings & investment", items: ["Savings goals with projections", "Collective investments", "Multi-tontine tracking"] },
      { category: "Marketplace & events", items: ["Community marketplace", "Group buying at wholesale prices", "Cultural events & assemblies", "Merged multi-tontine calendar"] },
      { category: "Communication & AI", items: ["Per-tontine group chat (real time)", "Public & restricted channels", "AI financial advisor (local, no external API)", "Smart notifications (push, email)"] },
      { category: "Reports & scoring", items: ["Individual & cross-tontine reports", "CSV export", "Scoring & gamification (5 levels)", "Badges and rewards", "Full audit trail"] },
      { category: "Technical & access", items: ["Multilingual interface (FR, EN, ES, DE + extensible)", "Android & iOS mobile app (Expo/React Native)", "Complete REST API", "Open source MIT/Apache 2.0", "Self-hostable (SQLite/PostgreSQL)"] },
    ],
    free: "Start for free", github: "GitHub — source code", soon: "View demo",
  },
  finalCta: { title1: "Ready to amplify", title2: "your tontine?", desc: "Join 2,500+ members digitizing their solidarity with Tchoua.", cta1: "Create my group", cta2: "View demo" },
  footer: {
    about: "The ERP for African tontines. Digitizing traditional solidarity with tomorrow's tools.",
    product: "Product", resources: "Resources", company: "Company", legal: "Legal",
    modules: "Modules", pricing: "Pricing", security: "Security", api: "Developer API",
    how: "How it works", help: "Help & support", aboutLink: "About us", contact: "Contact",
    privacy: "Privacy", terms: "Terms", cookies: "Cookies", rights: "All rights reserved.",
  },
};

const es: HomeCopy = {
  hero: {
    badge: "ERP de tontinas open source — 100 % gratis",
    title1: "La solidaridad,", title2: "digitalizada.",
    desc: "Tchoua convierte tu tontina tradicional en un sistema digital completo: transparencia total, contribuciones multicanal, préstamos y solidaridad.",
    cta1: "Empezar gratis", cta2: "Ver la demo", social: "4,9/5 · más de 2.500 miembros activos",
    ledger: "Libro mayor", rows: [
      { label: "Contribución M.", amount: "+50.000" }, { label: "Fondo de emergencia", amount: "+5.000" },
      { label: "Préstamo concedido", amount: "-100.000" }, { label: "Reembolso", amount: "+18.500" },
    ],
    vote: "Asamblea: voto inversión en terreno — 6/10", repayment: "Tasa de reembolso", members: "Miembros activos",
  },
  stats: [
    { value: "2.500+", label: "Miembros" }, { value: "180+", label: "Tontinas" },
    { value: "850M+", label: "FCFA gestionados" }, { value: "4", label: "Países" },
  ],
  tontines: {
    badge: "Funcionalidades", title1: "Una tontina.", title2: "Todos los tipos.",
    desc: "Contribuciones en efectivo, en especie o solidarias: Tchoua se adapta a cada tradición.",
    items: [
      { title: "Contribuciones en efectivo y en especie", desc: "MTN MoMo, Orange Money, Wave, efectivo, maíz, macabo, aceite de palma: todos los métodos aceptados.", tags: ["ROSCA", "ASCA", "Multidivisa"] },
      { title: "Contribuciones en especie", desc: "Gestione aportes no monetarios con conversión automática y control de calidad.", tags: ["Tontina natural", "Cooperativa", "Agricultura"] },
      { title: "Solidaridad y servicios", desc: "Fondos de emergencia, apoyo por nacimiento, matrimonio o duelo, e intercambio de servicios comunitarios.", tags: ["Ayuda mutua", "Emergencia", "Cultura"] },
    ],
  },
  places: {
    title: "Cada tontina tiene su lugar",
    desc: "Financiera, natural o cultural: cada práctica tradicional encuentra su espacio digital.",
    items: [
      { title: "Financiera", desc: "ROSCA y ASCA con turnos de sorteo, préstamos internos y microfinanzas comunitarias.", features: ["Turnos de sorteo automáticos", "Préstamos con intereses", "Informes OHADA", "Pagos móviles"] },
      { title: "En especie", desc: "Contribuciones en productos agrícolas con valoración e intercambio.", features: ["Conversión unidades/valor", "Control de calidad", "Mercado integrado", "Cooperativa agrícola"] },
      { title: "Servicios y competencias", desc: "Intercambie horas de trabajo, experiencia profesional y servicios domésticos.", features: ["Banco de tiempo", "Perfiles de competencias", "Valoración de intercambios", "Contratos de servicio"] },
    ],
  },
  steps: {
    badge: "Sencillez", title: "Juntos, en tres pasos", desc: "De la creación a la distribución, todo se hace en unos clics.", step: "Paso",
    items: [
      { title: "Cree su grupo", desc: "Configure su tontina en minutos: tipo, monto, frecuencia, reglas y miembros." },
      { title: "Contribuya a su ritmo", desc: "Mobile Money, efectivo o en especie: cada contribución se registra y confirma en tiempo real." },
      { title: "Distribuya con equidad", desc: "Sorteo aleatorio o por orden: cada beneficiario recibe lo suyo con transparencia." },
    ],
  },
  engagement: {
    badge: "Compromiso", title: "Valore cada compromiso",
    desc: "Puntos, insignias y niveles recompensan la fiabilidad, la solidaridad y la implicación comunitaria.",
    cta: "Ver mi puntuación", table: "Tabla de progreso",
    levels: [{ name: "Novato", pts: "0-99" }, { name: "Activo", pts: "100-299" }, { name: "Comprometido", pts: "300-599" }, { name: "Líder", pts: "600-999" }, { name: "Leyenda", pts: "1000+" }],
  },
  testimonials: {
    badge: "Comunidad", title: "La voz de las comunidades",
    items: [
      { text: "Desde que usamos Tchoua, nuestra tontina es mucho más transparente. Cada miembro puede ver las transacciones en tiempo real.", name: "Marie Ngono", initials: "MN", role: "Presidenta, Tontina Mujeres Emprendedoras, Yaundé" },
      { text: "Conseguí un micropréstamo en 48 horas gracias a mi buena puntuación Tchoua. La plataforma cambió nuestra forma de trabajar.", name: "Jean-Baptiste Nkomo", initials: "JN", role: "Miembro, Cooperativa Agrícola, Bafoussam" },
      { text: "Gestionar las contribuciones de maíz y café ahora es simple y preciso. Todos confían en el sistema.", name: "Alice Mballa", initials: "AM", role: "Secretaria, Ayuda Mutua Familia Mballa, Duala" },
    ],
  },
  modules: {
    badge: "Funcionalidades", title1: "18 módulos.", title2: "Un ecosistema completo.",
    desc: "Tchoua no reemplaza la tontina tradicional: le da alas digitales.",
    items: [
      { title: "Contribuciones", desc: "Efectivo y especie multicanal" }, { title: "Sesiones y sorteos", desc: "ROSCA y beneficiarios" },
      { title: "Préstamos y crédito", desc: "Microfinanzas internas" }, { title: "Solidaridad", desc: "Ayuda social y emergencias" },
      { title: "Ahorro", desc: "Objetivos y proyecciones" }, { title: "Mercado", desc: "Compras grupales y comercio" },
      { title: "Eventos", desc: "Cultura y asambleas" }, { title: "Chat grupal", desc: "Mensajería por tontina" },
      { title: "Asesor IA", desc: "Asesor financiero local" }, { title: "Informes", desc: "Analítica y exportación CSV" },
      { title: "Calendario", desc: "Vista unificada multitontina" }, { title: "Notificaciones", desc: "Push, SMS, correo" },
      { title: "Libro mayor", desc: "Contabilidad OHADA" }, { title: "Puntuación", desc: "Gamificación e insignias" },
      { title: "Naturaleza", desc: "Gestión de tontinas en especie" }, { title: "Miembros", desc: "Perfiles y roles" },
      { title: "Configuración", desc: "Ajustes avanzados" }, { title: "Plantillas de asociación", desc: "Biblioteca (AMSED, NDI…)" },
      { title: "Multipaís", desc: "CEMAC y diáspora" },
    ],
  },
  pricing: {
    badge: "Precios", title1: "Gratis y open source.", title2: "Para siempre.",
    desc: "Tchoua es 100 % gratis y open source (MIT/Apache 2.0). Todas las funcionalidades están incluidas, sin límites, sin tarjeta bancaria, para siempre.",
    plan: "Gratis", price: "0 FCFA", sub: "Para siempre · Sin tarjeta · Autoalojable",
    perks: ["18 módulos incluidos", "Miembros ilimitados", "Tontinas ilimitadas", "Código abierto"],
    included: "Todas las funcionalidades incluidas",
    groups: [
      { category: "Gestión de tontinas", items: ["Tontinas ilimitadas (ROSCA, ASCA, natural, servicios, solidaridad, híbrida)", "Miembros ilimitados por tontina", "Frecuencias flexibles (1er sábado, después del 5, día fijo, semanal…)", "Partes configurables + remanente en caja", "Varios beneficiarios por sesión", "Modos de asignación: monto fijo o % del bote"] },
      { category: "Contribuciones y pagos", items: ["Contribuciones en efectivo multidivisa (FCFA, XAF…)", "Contribuciones en especie (maíz, aceite, café…)", "Intercambio de servicios y competencias", "MTN MoMo, Orange Money, Wave, Express Union, efectivo", "Seguimiento de retrasos y penalizaciones"] },
      { category: "Caja y microfinanzas", items: ["Caja automática (remanente acumulado)", "Préstamos de caja con interés mensual", "Reembolso obligatorio en la siguiente sesión", "Préstamos internos con aprobación y seguimiento", "Tabla de amortización automática", "Libro mayor compartido (norma OHADA)"] },
      { category: "Solidaridad y ayuda", items: ["Fondo de emergencia (enfermedad, accidente, fallecimiento)", "Ayuda por nacimiento, matrimonio y escolaridad", "Voto democrático sobre las decisiones", "Asamblea general virtual"] },
      { category: "Ahorro e inversión", items: ["Objetivos de ahorro con proyecciones", "Inversiones colectivas", "Seguimiento multitontina"] },
      { category: "Mercado y eventos", items: ["Mercado comunitario", "Compras grupales a precio mayorista", "Eventos culturales y asambleas", "Calendario fusionado multitontina"] },
      { category: "Comunicación e IA", items: ["Chat grupal por tontina (tiempo real)", "Canales públicos y restringidos", "Asesor financiero IA (local, sin API externa)", "Notificaciones inteligentes (push, correo)"] },
      { category: "Informes y puntuación", items: ["Informes individuales y cruzados multitontina", "Exportación CSV", "Puntuación y gamificación (5 niveles)", "Insignias y recompensas", "Pista de auditoría completa"] },
      { category: "Técnico y acceso", items: ["Interfaz multilingüe (FR, EN, ES, DE + extensible)", "App móvil Android e iOS (Expo/React Native)", "API REST completa", "Open source MIT/Apache 2.0", "Autoalojable (SQLite/PostgreSQL)"] },
    ],
    free: "Empezar gratis", github: "GitHub — código fuente", soon: "Ver la demo",
  },
  finalCta: { title1: "¿Listo para amplificar", title2: "su tontina?", desc: "Únase a más de 2.500 miembros que digitalizan su solidaridad con Tchoua.", cta1: "Crear mi grupo", cta2: "Ver la demo" },
  footer: {
    about: "El ERP de las tontinas africanas. Digitalizar la solidaridad tradicional con las herramientas del mañana.",
    product: "Producto", resources: "Recursos", company: "Empresa", legal: "Legal",
    modules: "Módulos", pricing: "Precios", security: "Seguridad", api: "API para desarrolladores",
    how: "Cómo funciona", help: "Ayuda y soporte", aboutLink: "Sobre nosotros", contact: "Contacto",
    privacy: "Privacidad", terms: "Términos", cookies: "Cookies", rights: "Todos los derechos reservados.",
  },
};

const de: HomeCopy = {
  hero: {
    badge: "Open-Source-Tontinen-ERP — 100 % kostenlos",
    title1: "Solidarität,", title2: "digitalisiert.",
    desc: "Tchoua verwandelt Ihre traditionelle Tontine in ein vollständiges digitales System — volle Transparenz, Beiträge über alle Kanäle, Kredite und Solidarität.",
    cta1: "Kostenlos starten", cta2: "Demo ansehen", social: "4,9/5 · über 2.500 aktive Mitglieder",
    ledger: "Hauptbuch", rows: [
      { label: "Mitgliedsbeitrag", amount: "+50.000" }, { label: "Notfallfonds", amount: "+5.000" },
      { label: "Gewährtes Darlehen", amount: "-100.000" }, { label: "Rückzahlung", amount: "+18.500" },
    ],
    vote: "Versammlung: Abstimmung Grundstücksinvestition — 6/10", repayment: "Rückzahlungsquote", members: "Aktive Mitglieder",
  },
  stats: [
    { value: "2.500+", label: "Mitglieder" }, { value: "180+", label: "Tontinen" },
    { value: "850M+", label: "FCFA verwaltet" }, { value: "4", label: "Länder" },
  ],
  tontines: {
    badge: "Funktionen", title1: "Eine Tontine.", title2: "Alle Arten.",
    desc: "Bargeld-, Sach- oder Solidaritätsbeiträge: Tchoua passt sich jeder Tradition an.",
    items: [
      { title: "Bar- & Sachbeiträge", desc: "MTN MoMo, Orange Money, Wave, Bargeld, Mais, Macabo, Palmöl — alle Beitragsarten werden unterstützt.", tags: ["ROSCA", "ASCA", "Mehrwährung"] },
      { title: "Sachbeiträge", desc: "Verwalten Sie unbare Beiträge mit automatischer Umrechnung und Qualitätskontrolle.", tags: ["Natur-Tontine", "Genossenschaft", "Landwirtschaft"] },
      { title: "Solidarität & Dienste", desc: "Notfallfonds, Unterstützung bei Geburt, Hochzeit und Trauer sowie gemeinnütziger Dienstleistungstausch.", tags: ["Nachbarschaftshilfe", "Notfall", "Kultur"] },
    ],
  },
  places: {
    title: "Jede Tontine hat ihren Platz",
    desc: "Finanziell, natürlich oder kulturell — jede traditionelle Praxis findet ihr digitales Zuhause.",
    items: [
      { title: "Finanziell", desc: "ROSCA und ASCA mit Auslosungsrunden, internen Krediten und gemeinschaftlicher Mikrofinanz.", features: ["Automatische Auslosungsrunden", "Kredite mit Zinsen", "OHADA-Berichte", "Mobile Zahlungen"] },
      { title: "In Naturalien", desc: "Beiträge in Agrarprodukten mit Bewertungs- und Tauschsystem.", features: ["Einheiten-/Wertumrechnung", "Qualitätskontrolle", "Integrierter Marktplatz", "Landwirtschaftliche Genossenschaft"] },
      { title: "Dienste & Kompetenzen", desc: "Tauschen Sie Arbeitsstunden, berufliche Expertise und Haushaltsdienste.", features: ["Zeitbank", "Kompetenzprofile", "Bewertung der Tauschgeschäfte", "Dienstleistungsverträge"] },
    ],
  },
  steps: {
    badge: "Einfachheit", title: "Gemeinsam in drei Schritten", desc: "Von der Gründung bis zur Auszahlung — alles mit wenigen Klicks.", step: "Schritt",
    items: [
      { title: "Gruppe erstellen", desc: "Richten Sie Ihre Tontine in Minuten ein — Typ, Betrag, Häufigkeit, Regeln und Mitglieder." },
      { title: "In Ihrem Tempo beitragen", desc: "Mobile Money, Bargeld oder Naturalien — jeder Beitrag wird in Echtzeit erfasst und bestätigt." },
      { title: "Fair auszahlen", desc: "Zufällige oder geordnete Auslosung: Jeder Begünstigte erhält seinen Anteil transparent." },
    ],
  },
  engagement: {
    badge: "Engagement", title: "Jedes Engagement zählt",
    desc: "Punkte, Abzeichen und Stufen belohnen Zuverlässigkeit, Solidarität und gemeinschaftliches Engagement.",
    cta: "Meine Punktzahl", table: "Fortschrittstabelle",
    levels: [{ name: "Neuling", pts: "0-99" }, { name: "Aktiv", pts: "100-299" }, { name: "Engagiert", pts: "300-599" }, { name: "Führer", pts: "600-999" }, { name: "Legende", pts: "1000+" }],
  },
  testimonials: {
    badge: "Gemeinschaft", title: "Stimmen aus der Gemeinschaft",
    items: [
      { text: "Seit wir Tchoua nutzen, ist unsere Tontine viel transparenter. Jedes Mitglied sieht die Transaktionen in Echtzeit.", name: "Marie Ngono", initials: "MN", role: "Präsidentin, Tontine Frauenunternehmerinnen, Yaoundé" },
      { text: "Dank meiner guten Tchoua-Punktzahl erhielt ich innerhalb von 48 Stunden einen Mikrokredit. Die Plattform hat unsere Arbeitsweise verändert.", name: "Jean-Baptiste Nkomo", initials: "JN", role: "Mitglied, Landwirtschaftliche Genossenschaft, Bafoussam" },
      { text: "Die Verwaltung von Mais- und Kaffeebeiträgen ist jetzt einfach und präzise. Alle vertrauen dem System.", name: "Alice Mballa", initials: "AM", role: "Sekretärin, Familienenhilfe Mballa, Douala" },
    ],
  },
  modules: {
    badge: "Funktionen", title1: "18 Module.", title2: "Ein vollständiges Ökosystem.",
    desc: "Tchoua ersetzt die traditionelle Tontine nicht — es verleiht ihr digitale Flügel.",
    items: [
      { title: "Beiträge", desc: "Bargeld & Naturalien, mehrere Kanäle" }, { title: "Sitzungen & Auslosung", desc: "ROSCA und Begünstigte" },
      { title: "Kredite & Bonität", desc: "Interne Mikrofinanz" }, { title: "Solidarität", desc: "Sozialhilfe und Notfälle" },
      { title: "Sparen", desc: "Ziele und Prognosen" }, { title: "Marktplatz", desc: "Gruppenkäufe & Handel" },
      { title: "Veranstaltungen", desc: "Kultur & Versammlungen" }, { title: "Gruppenchat", desc: "Nachrichten pro Tontine" },
      { title: "KI-Berater", desc: "Lokaler Finanzberater" }, { title: "Berichte", desc: "Analyse & CSV-Export" },
      { title: "Kalender", desc: "Einheitliche Mehrfachansicht" }, { title: "Benachrichtigungen", desc: "Push, SMS, E-Mail" },
      { title: "Hauptbuch", desc: "OHADA-Buchhaltung" }, { title: "Scoring", desc: "Gamification & Abzeichen" },
      { title: "Natur", desc: "Verwaltung von Naturaltontinen" }, { title: "Mitglieder", desc: "Profile & Rollen" },
      { title: "Einstellungen", desc: "Erweiterte Konfiguration" }, { title: "Vereinsvorlagen", desc: "Bibliothek (AMSED, NDI…)" },
      { title: "Mehrere Länder", desc: "CEMAC & Diaspora" },
    ],
  },
  pricing: {
    badge: "Preise", title1: "Kostenlos & Open Source.", title2: "Für immer.",
    desc: "Tchoua ist 100 % kostenlos und Open Source (MIT/Apache 2.0). Alle Funktionen sind enthalten — ohne Limits, ohne Kreditkarte, für immer.",
    plan: "Kostenlos", price: "0 FCFA", sub: "Für immer · Ohne Kreditkarte · Selbst hostbar",
    perks: ["18 Module inklusive", "Unbegrenzte Mitglieder", "Unbegrenzte Tontinen", "Offener Quellcode"],
    included: "Alle Funktionen inklusive",
    groups: [
      { category: "Tontinenverwaltung", items: ["Unbegrenzte Tontinen (ROSCA, ASCA, Naturalien, Dienste, Solidarität, hybrid)", "Unbegrenzte Mitglieder pro Tontine", "Flexible Häufigkeiten (1. Samstag, nach dem 5., fester Tag, wöchentlich…)", "Konfigurierbare Anteile + Rest in der Kasse", "Mehrere Begünstigte pro Sitzung", "Zuteilungsmodi: fester Betrag oder % des Topfes"] },
      { category: "Beiträge & Zahlungen", items: ["Bargeldbeiträge in mehreren Währungen (FCFA, XAF…)", "Sachbeiträge (Mais, Öl, Kaffee…)", "Austausch von Diensten und Kompetenzen", "MTN MoMo, Orange Money, Wave, Express Union, Bargeld", "Verfolgung von Verspätungen und Strafen"] },
      { category: "Kasse & Mikrofinanz", items: ["Automatische Kasse (kumulierter Rest)", "Kassendarlehen mit Monatszins", "Pflichtrückzahlung in der nächsten Sitzung", "Interne Darlehen mit Genehmigung und Verfolgung", "Automatischer Tilgungsplan", "Gemeinsames Hauptbuch (OHADA-Standard)"] },
      { category: "Solidarität & Hilfe", items: ["Notfallfonds (Krankheit, Unfall, Tod)", "Hilfe bei Geburt, Hochzeit und Schulbildung", "Demokratische Abstimmung über Entscheidungen", "Virtuelle Generalversammlung"] },
      { category: "Sparen & Investieren", items: ["Sparziele mit Prognosen", "Gemeinsame Investitionen", "Verfolgung über mehrere Tontinen"] },
      { category: "Marktplatz & Veranstaltungen", items: ["Gemeinschaftsmarktplatz", "Gruppenkäufe zu Großhandelspreisen", "Kulturelle Veranstaltungen & Versammlungen", "Zusammengeführter Mehrfachkalender"] },
      { category: "Kommunikation & KI", items: ["Gruppenchat pro Tontine (Echtzeit)", "Öffentliche & eingeschränkte Kanäle", "KI-Finanzberater (lokal, ohne externe API)", "Intelligente Benachrichtigungen (Push, E-Mail)"] },
      { category: "Berichte & Scoring", items: ["Individuelle & tontinenübergreifende Berichte", "CSV-Export", "Scoring & Gamification (5 Stufen)", "Abzeichen und Belohnungen", "Vollständige Audit-Spur"] },
      { category: "Technik & Zugang", items: ["Mehrsprachige Oberfläche (FR, EN, ES, DE + erweiterbar)", "Android- & iOS-App (Expo/React Native)", "Vollständige REST-API", "Open Source MIT/Apache 2.0", "Selbst hostbar (SQLite/PostgreSQL)"] },
    ],
    free: "Kostenlos starten", github: "GitHub — Quellcode", soon: "Demo ansehen",
  },
  finalCta: { title1: "Bereit, Ihre Tontine", title2: "zu verstärken?", desc: "Schließen Sie sich über 2.500 Mitgliedern an, die ihre Solidarität mit Tchoua digitalisieren.", cta1: "Meine Gruppe erstellen", cta2: "Demo ansehen" },
  footer: {
    about: "Das ERP für afrikanische Tontinen. Traditionelle Solidarität mit den Werkzeugen von morgen digitalisieren.",
    product: "Produkt", resources: "Ressourcen", company: "Unternehmen", legal: "Rechtliches",
    modules: "Module", pricing: "Preise", security: "Sicherheit", api: "Entwickler-API",
    how: "So funktioniert es", help: "Hilfe & Support", aboutLink: "Über uns", contact: "Kontakt",
    privacy: "Datenschutz", terms: "AGB", cookies: "Cookies", rights: "Alle Rechte vorbehalten.",
  },
};

export const HOME_COPY: Record<PublicLang, HomeCopy> = { fr, en, es, de };

export const HEADER_COPY: Record<PublicLang, { login: string; start: string; language: string; menu: string; close: string }> = {
  fr: { login: "Connexion", start: "Commencer", language: "Langue", menu: "Menu", close: "Fermer" },
  en: { login: "Sign in", start: "Get started", language: "Language", menu: "Menu", close: "Close" },
  es: { login: "Iniciar sesión", start: "Empezar", language: "Idioma", menu: "Menú", close: "Cerrar" },
  de: { login: "Anmelden", start: "Loslegen", language: "Sprache", menu: "Menü", close: "Schließen" },
};

export function publicLang(lang: string): PublicLang {
  return (["fr", "en", "es", "de"].includes(lang) ? lang : "fr") as PublicLang;
}

export const ABOUT_COPY = {
  fr: {
    badge: "Notre mission", title1: "Digitaliser la", title2: "solidarité.",
    intro: "Tchoua est né de la volonté de moderniser les tontines traditionnelles en leur offrant la puissance du numérique, tout en préservant leurs valeurs humaines.",
    storyTitle: "D'une tradition ancestrale à un écosystème moderne.",
    story1: "Les tontines sont le socle de l'économie sociale en Afrique et dans le monde. Elles permettent de financer des projets, d'épargner et de s'entraider. Pourtant, leur gestion manuelle limite souvent leur potentiel.",
    story2: "Tchoua apporte la transparence, l'automatisation et la sécurité nécessaires pour que ces groupes passent à l'échelle supérieure, sans perdre l'âme de la solidarité.",
    openSource: "Open Source", free: "Gratuit", forGroups: "Pour les petits groupes",
    trustTitle: "La confiance numérique", trustDesc: "Nous construisons les outils qui permettent à la confiance de s'épanouir dans le monde numérique.",
    valuesTitle: "Nos valeurs fondamentales",
    values: [
      { title: "Transparence radicale", desc: "Chaque transaction, chaque vote et chaque tirage au sort est auditable par tous les membres concernés." },
      { title: "Inclusion sans faille", desc: "Du smartphone dernier cri au téléphone basique via USSD, nous incluons tout le monde." },
      { title: "Souveraineté africaine", desc: "Conçu pour et par les contextes locaux, avec des données hébergées en priorité sur le continent." },
    ],
    ctaTitle: "Rejoignez le mouvement.", ctaDesc: "Soyez parmi les premiers à transformer la gestion de votre tontine et à participer à une finance plus solidaire.",
    ctaStart: "Démarrer maintenant", ctaContact: "Nous contacter",
  },
  en: {
    badge: "Our mission", title1: "Digitizing", title2: "solidarity.",
    intro: "Tchoua was born from the desire to modernize traditional tontines by giving them the power of digital tools while preserving their human values.",
    storyTitle: "From an ancestral tradition to a modern ecosystem.",
    story1: "Tontines are the foundation of the social economy in Africa and around the world. They finance projects, build savings and foster mutual aid. Yet manual management often limits their potential.",
    story2: "Tchoua brings the transparency, automation and security these groups need to scale up without losing the soul of solidarity.",
    openSource: "Open Source", free: "Free", forGroups: "For small groups",
    trustTitle: "Digital trust", trustDesc: "We build the tools that let trust flourish in the digital world.",
    valuesTitle: "Our core values",
    values: [
      { title: "Radical transparency", desc: "Every transaction, vote and draw is auditable by every member concerned." },
      { title: "Seamless inclusion", desc: "From the latest smartphone to a basic phone via USSD, we include everyone." },
      { title: "African sovereignty", desc: "Designed for and by local contexts, with data hosted primarily on the continent." },
    ],
    ctaTitle: "Join the movement.", ctaDesc: "Be among the first to transform how your tontine is managed and help build a more solidarity-driven financial system.",
    ctaStart: "Start now", ctaContact: "Contact us",
  },
  es: {
    badge: "Nuestra misión", title1: "Digitalizar la", title2: "solidaridad.",
    intro: "Tchoua nació de la voluntad de modernizar las tontinas tradicionales ofreciéndoles la potencia de lo digital, preservando sus valores humanos.",
    storyTitle: "De una tradición ancestral a un ecosistema moderno.",
    story1: "Las tontinas son la base de la economía social en África y en el mundo. Permiten financiar proyectos, ahorrar y ayudarse mutuamente. Sin embargo, su gestión manual limita a menudo su potencial.",
    story2: "Tchoua aporta la transparencia, la automatización y la seguridad necesarias para que estos grupos crezcan sin perder el alma de la solidaridad.",
    openSource: "Open Source", free: "Gratis", forGroups: "Para grupos pequeños",
    trustTitle: "La confianza digital", trustDesc: "Construimos las herramientas que permiten que la confianza florezca en el mundo digital.",
    valuesTitle: "Nuestros valores fundamentales",
    values: [
      { title: "Transparencia radical", desc: "Cada transacción, voto y sorteo puede ser auditado por todos los miembros implicados." },
      { title: "Inclusión sin barreras", desc: "Desde el último smartphone hasta un teléfono básico por USSD, incluimos a todos." },
      { title: "Soberanía africana", desc: "Diseñado para y por los contextos locales, con datos alojados prioritariamente en el continente." },
    ],
    ctaTitle: "Únete al movimiento.", ctaDesc: "Sé de los primeros en transformar la gestión de tu tontina y participar en una financiación más solidaria.",
    ctaStart: "Empezar ahora", ctaContact: "Contáctanos",
  },
  de: {
    badge: "Unsere Mission", title1: "Solidarität", title2: "digitalisieren.",
    intro: "Tchoua entstand aus dem Wunsch, traditionelle Tontinen zu modernisieren und ihnen die Kraft der Digitalisierung zu geben, ohne ihre menschlichen Werte zu verlieren.",
    storyTitle: "Von einer alten Tradition zu einem modernen Ökosystem.",
    story1: "Tontinen sind die Grundlage der Sozialwirtschaft in Afrika und weltweit. Sie finanzieren Projekte, bilden Ersparnisse und fördern gegenseitige Hilfe. Doch die manuelle Verwaltung begrenzt oft ihr Potenzial.",
    story2: "Tchoua bringt die nötige Transparenz, Automatisierung und Sicherheit, damit diese Gruppen wachsen können, ohne die Seele der Solidarität zu verlieren.",
    openSource: "Open Source", free: "Kostenlos", forGroups: "Für kleine Gruppen",
    trustTitle: "Digitales Vertrauen", trustDesc: "Wir bauen die Werkzeuge, die Vertrauen in der digitalen Welt ermöglichen.",
    valuesTitle: "Unsere Grundwerte",
    values: [
      { title: "Radikale Transparenz", desc: "Jede Transaktion, jede Abstimmung und jede Auslosung ist für alle betroffenen Mitglieder prüfbar." },
      { title: "Nahtlose Inklusion", desc: "Vom neuesten Smartphone bis zum einfachen Telefon per USSD schließen wir alle ein." },
      { title: "Afrikanische Souveränität", desc: "Für und von lokalen Kontexten gestaltet, mit Daten, die vorrangig auf dem Kontinent gehostet werden." },
    ],
    ctaTitle: "Schließen Sie sich an.", ctaDesc: "Seien Sie unter den Ersten, die die Verwaltung ihrer Tontine verändern und eine solidarischere Finanzwelt mitgestalten.",
    ctaStart: "Jetzt starten", ctaContact: "Kontakt",
  },
} as const;

export type AboutCopy = (typeof ABOUT_COPY)["fr"];

export const SECURITY_COPY = {
  fr: {
    title1: "La confiance par la", title2: "sécurité.",
    intro: "Chez Tchoua, la protection de vos fonds et de vos données n'est pas une option. C'est le socle sur lequel repose notre plateforme.",
    pillars: [
      { title: "Chiffrement de bout en bout", desc: "Vos données sensibles et vos transactions sont chiffrées (AES-256) avant même de quitter votre appareil." },
      { title: "Architecture décentralisée", desc: "Nous utilisons des registres partagés pour garantir l'immutabilité de vos historiques financiers." },
      { title: "Vérification multifacteur", desc: "Chaque action critique exige une double validation (SMS/e-mail) ou une approbation par les pairs." },
    ],
    layersTitle: "Une protection multicouche pour votre association.",
    layers: [
      { title: "Souveraineté des données", desc: "Vos données sont hébergées dans des centres sécurisés, avec une priorité aux infrastructures locales africaines." },
      { title: "Audit en temps réel", desc: "Chaque membre peut consulter le journal d'audit complet de l'association. Plus aucune zone d'ombre." },
      { title: "Conformité réglementaire", desc: "Tchoua est conçu pour respecter les normes de protection des données et les régulations financières locales." },
    ],
    statusTitle: "Statut du système",
    statuses: [
      { label: "Chiffrement des données", status: "Actif" },
      { label: "Authentification 2FA", status: "Actif" },
      { label: "Pare-feu réseau", status: "Sécurisé" },
      { label: "Intégrité des registres", status: "100 %" },
    ],
    scan: "Surveillance continue", scanValue: "24 h/24 · 7 j/7",
    ctaTitle: "Transparence totale.",
    ctaDesc: "Vous voulez en savoir plus sur nos protocoles techniques ou signaler une vulnérabilité ? Consultez notre documentation de sécurité.",
    dev: "Espace développeur", support: "Support sécurité",
  },
  en: {
    title1: "Trust through", title2: "security.",
    intro: "At Tchoua, protecting your funds and data is not optional. It is the foundation our platform is built on.",
    pillars: [
      { title: "End-to-end encryption", desc: "Your sensitive data and transactions are encrypted (AES-256) before they even leave your device." },
      { title: "Decentralized architecture", desc: "We use shared ledgers to guarantee the immutability of your financial history." },
      { title: "Multi-factor verification", desc: "Every critical action requires double validation (SMS/email) or peer approval." },
    ],
    layersTitle: "Multi-layered protection for your association.",
    layers: [
      { title: "Data sovereignty", desc: "Your data is hosted in secure data centers, prioritizing local African infrastructure." },
      { title: "Real-time audit", desc: "Every member can view the association's full audit log. No more blind spots." },
      { title: "Regulatory compliance", desc: "Tchoua is designed to meet data protection standards and local financial regulations." },
    ],
    statusTitle: "System status",
    statuses: [
      { label: "Data encryption", status: "Active" },
      { label: "2FA authentication", status: "Active" },
      { label: "Network firewall", status: "Secured" },
      { label: "Ledger integrity", status: "100%" },
    ],
    scan: "Continuous monitoring", scanValue: "24/7",
    ctaTitle: "Total transparency.",
    ctaDesc: "Want to learn more about our technical protocols or report a vulnerability? Read our security documentation.",
    dev: "Developer space", support: "Security support",
  },
  es: {
    title1: "La confianza mediante la", title2: "seguridad.",
    intro: "En Tchoua, proteger sus fondos y sus datos no es opcional. Es la base sobre la que se construye nuestra plataforma.",
    pillars: [
      { title: "Cifrado de extremo a extremo", desc: "Sus datos sensibles y transacciones se cifran (AES-256) antes de salir de su dispositivo." },
      { title: "Arquitectura descentralizada", desc: "Utilizamos registros compartidos para garantizar la inmutabilidad de su historial financiero." },
      { title: "Verificación multifactor", desc: "Cada acción crítica requiere doble validación (SMS/correo) o aprobación por pares." },
    ],
    layersTitle: "Una protección multicapa para su asociación.",
    layers: [
      { title: "Soberanía de los datos", desc: "Sus datos se alojan en centros seguros, priorizando la infraestructura local africana." },
      { title: "Auditoría en tiempo real", desc: "Cada miembro puede consultar el registro de auditoría completo de la asociación." },
      { title: "Cumplimiento normativo", desc: "Tchoua está diseñado para respetar las normas de protección de datos y las regulaciones financieras locales." },
    ],
    statusTitle: "Estado del sistema",
    statuses: [
      { label: "Cifrado de datos", status: "Activo" },
      { label: "Autenticación 2FA", status: "Activo" },
      { label: "Cortafuegos de red", status: "Seguro" },
      { label: "Integridad de registros", status: "100 %" },
    ],
    scan: "Vigilancia continua", scanValue: "24/7",
    ctaTitle: "Transparencia total.",
    ctaDesc: "¿Desea conocer nuestros protocolos técnicos o reportar una vulnerabilidad? Consulte nuestra documentación de seguridad.",
    dev: "Espacio desarrollador", support: "Soporte de seguridad",
  },
  de: {
    title1: "Vertrauen durch", title2: "Sicherheit.",
    intro: "Bei Tchoua ist der Schutz Ihrer Gelder und Daten keine Option. Er ist das Fundament unserer Plattform.",
    pillars: [
      { title: "Ende-zu-Ende-Verschlüsselung", desc: "Ihre sensiblen Daten und Transaktionen werden (AES-256) verschlüsselt, bevor sie Ihr Gerät verlassen." },
      { title: "Dezentrale Architektur", desc: "Wir nutzen gemeinsame Register, um die Unveränderlichkeit Ihrer Finanzhistorie zu garantieren." },
      { title: "Mehrfaktor-Verifizierung", desc: "Jede kritische Aktion erfordert eine doppelte Bestätigung (SMS/E-Mail) oder Zustimmung durch Peers." },
    ],
    layersTitle: "Mehrschichtiger Schutz für Ihren Verein.",
    layers: [
      { title: "Datensouveränität", desc: "Ihre Daten werden in sicheren Rechenzentren gehostet, vorrangig auf lokaler afrikanischer Infrastruktur." },
      { title: "Echtzeit-Audit", desc: "Jedes Mitglied kann das vollständige Audit-Protokoll des Vereins einsehen. Keine blinden Flecken mehr." },
      { title: "Regulatorische Konformität", desc: "Tchoua ist auf die Einhaltung von Datenschutzstandards und lokalen Finanzvorschriften ausgelegt." },
    ],
    statusTitle: "Systemstatus",
    statuses: [
      { label: "Datenverschlüsselung", status: "Aktiv" },
      { label: "2FA-Authentifizierung", status: "Aktiv" },
      { label: "Netzwerk-Firewall", status: "Gesichert" },
      { label: "Registerintegrität", status: "100 %" },
    ],
    scan: "Kontinuierliche Überwachung", scanValue: "24/7",
    ctaTitle: "Volle Transparenz.",
    ctaDesc: "Möchten Sie mehr über unsere technischen Protokolle erfahren oder eine Schwachstelle melden? Lesen Sie unsere Sicherheitsdokumentation.",
    dev: "Entwicklerbereich", support: "Sicherheits-Support",
  },
} as const;

export const AIDE_COPY = {
  fr: {
    title: "Aide", heroTitle: "Comment pouvons-nous vous aider ?", heroSubtitle: "Centre d'aide, FAQ et assistance contextuelle", search: "Rechercher dans l'aide…",
    topicsTitle: "Sujets populaires",
    topics: [
      { title: "Premiers pas", desc: "Créer son compte, rejoindre une tontine, première cotisation" },
      { title: "Tontines & sessions", desc: "Comprendre les types, le tirage, les enchères et la rotation" },
      { title: "Cotisations & paiements", desc: "Mobile Money, virement, espèces, calendriers de paiement" },
      { title: "Prêts & caisse", desc: "Demander un prêt, les taux, les garanties, le remboursement" },
      { title: "Score de confiance", desc: "Comment le score est calculé, niveaux, badges, contestation" },
      { title: "Associations", desc: "Assistant de création, modèles A30/AMSED, bureau, règlement" },
      { title: "Réunions & présence", desc: "Planning, quorum, procurations, amendes de retard" },
      { title: "Aides sociales", desc: "Catégories, plafonds, justificatifs, vote du bureau" },
      { title: "Sécurité & confidentialité", desc: "Authentification, données personnelles, RGPD" },
    ],
    faqTitle: "Questions fréquentes",
    faqs: [
      { q: "Comment rejoindre une tontine existante ?", a: "Demandez le code d'invitation au président. Allez dans « Mes Associations » → « Rejoindre » et saisissez le code. Votre adhésion sera validée par le bureau." },
      { q: "Comment payer ma cotisation par Mobile Money ?", a: "Sur la page Cotisations, cliquez « Payer », choisissez Mobile Money, puis suivez les instructions. Le reçu est généré automatiquement." },
      { q: "Que se passe-t-il si je manque une session ?", a: "Une amende fixée par le règlement intérieur s'applique. Vous pouvez l'éviter en envoyant une procuration ou un justificatif validé par le bureau." },
      { q: "Mon score de confiance a baissé, pourquoi ?", a: "Les baisses sont détaillées dans l'historique du score (page Gamification) : retard de cotisation, absence non excusée, prêt non remboursé. Vous pouvez contester via le formulaire dédié." },
      { q: "Puis-je créer plusieurs associations ?", a: "Oui, sans limite. Chaque association est indépendante avec son bureau, ses activités et son scoring." },
    ],
    moreTitle: "Besoin de plus d'aide ?",
    cards: [
      { title: "Académie", desc: "Manuel utilisateur complet", cta: "Consulter →", href: "/academie" },
      { title: "Chat communautaire", desc: "Posez la question à votre groupe", cta: "Ouvrir →", href: "/chat" },
      { title: "E-mail du support", desc: "support@tchoua.app", cta: "Contacter →", href: "mailto:support@tchoua.app" },
    ],
  },
  en: {
    title: "Help", heroTitle: "How can we help you?", heroSubtitle: "Help center, FAQ and contextual assistance", search: "Search the help center…",
    topicsTitle: "Popular topics",
    topics: [
      { title: "Getting started", desc: "Create an account, join a tontine, first contribution" },
      { title: "Tontines & sessions", desc: "Understand types, draws, auctions and rotation" },
      { title: "Contributions & payments", desc: "Mobile Money, transfer, cash, payment schedules" },
      { title: "Loans & treasury", desc: "Request a loan, rates, guarantees, repayment" },
      { title: "Trust score", desc: "How the score is calculated, levels, badges, disputes" },
      { title: "Associations", desc: "Creation wizard, A30/AMSED templates, board, rules" },
      { title: "Meetings & attendance", desc: "Schedule, quorum, proxies, late fines" },
      { title: "Social aid", desc: "Categories, caps, supporting documents, board vote" },
      { title: "Security & privacy", desc: "Authentication, personal data, GDPR" },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "How do I join an existing tontine?", a: "Ask the president for the invitation code. Go to “My Associations” → “Join” and enter the code. The board will approve your membership." },
      { q: "How do I pay my contribution with Mobile Money?", a: "On the Contributions page, click “Pay”, choose Mobile Money and follow the instructions. The receipt is generated automatically." },
      { q: "What happens if I miss a session?", a: "A fine set by the internal rules applies. You can avoid it by sending a proxy or a supporting document approved by the board." },
      { q: "My trust score dropped — why?", a: "Every change is detailed in the score history (Gamification page): late contribution, unexcused absence, unpaid loan. You can dispute it through the dedicated form." },
      { q: "Can I create several associations?", a: "Yes, without limit. Each association is independent with its own board, activities and scoring." },
    ],
    moreTitle: "Need more help?",
    cards: [
      { title: "Academy", desc: "Complete user manual", cta: "Open →", href: "/academie" },
      { title: "Community chat", desc: "Ask your group", cta: "Open →", href: "/chat" },
      { title: "Support email", desc: "support@tchoua.app", cta: "Contact →", href: "mailto:support@tchoua.app" },
    ],
  },
  es: {
    title: "Ayuda", heroTitle: "¿Cómo podemos ayudarle?", heroSubtitle: "Centro de ayuda, FAQ y asistencia contextual", search: "Buscar en la ayuda…",
    topicsTitle: "Temas populares",
    topics: [
      { title: "Primeros pasos", desc: "Crear una cuenta, unirse a una tontina, primera contribución" },
      { title: "Tontinas y sesiones", desc: "Comprender los tipos, sorteos, subastas y rotación" },
      { title: "Contribuciones y pagos", desc: "Mobile Money, transferencia, efectivo, calendarios de pago" },
      { title: "Préstamos y caja", desc: "Solicitar un préstamo, tasas, garantías, reembolso" },
      { title: "Puntuación de confianza", desc: "Cómo se calcula, niveles, insignias, reclamaciones" },
      { title: "Asociaciones", desc: "Asistente de creación, plantillas A30/AMSED, junta, reglamento" },
      { title: "Reuniones y asistencia", desc: "Planificación, quórum, poderes, multas por retraso" },
      { title: "Ayudas sociales", desc: "Categorías, límites, justificantes, voto de la junta" },
      { title: "Seguridad y privacidad", desc: "Autenticación, datos personales, RGPD" },
    ],
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { q: "¿Cómo unirse a una tontina existente?", a: "Pida el código de invitación al presidente. Vaya a «Mis Asociaciones» → «Unirse» e introdúzcalo. La junta validará su membresía." },
      { q: "¿Cómo pago mi contribución por Mobile Money?", a: "En la página Contribuciones, pulse «Pagar», elija Mobile Money y siga las instrucciones. El recibo se genera automáticamente." },
      { q: "¿Qué pasa si falto a una sesión?", a: "Se aplica una multa fijada por el reglamento interno. Puede evitarla enviando un poder o un justificante aprobado por la junta." },
      { q: "Mi puntuación de confianza bajó, ¿por qué?", a: "Las variaciones se detallan en el historial (página Gamificación): retraso, ausencia no justificada, préstamo impagado. Puede reclamar mediante el formulario." },
      { q: "¿Puedo crear varias asociaciones?", a: "Sí, sin límite. Cada asociación es independiente con su propia junta, actividades y puntuación." },
    ],
    moreTitle: "¿Necesita más ayuda?",
    cards: [
      { title: "Academia", desc: "Manual de usuario completo", cta: "Consultar →", href: "/academie" },
      { title: "Chat comunitario", desc: "Pregunte a su grupo", cta: "Abrir →", href: "/chat" },
      { title: "Correo de soporte", desc: "support@tchoua.app", cta: "Contactar →", href: "mailto:support@tchoua.app" },
    ],
  },
  de: {
    title: "Hilfe", heroTitle: "Wie können wir helfen?", heroSubtitle: "Hilfe-Center, FAQ und kontextbezogene Unterstützung", search: "Hilfe durchsuchen…",
    topicsTitle: "Beliebte Themen",
    topics: [
      { title: "Erste Schritte", desc: "Konto erstellen, Tontine beitreten, erster Beitrag" },
      { title: "Tontinen & Sitzungen", desc: "Typen, Auslosung, Auktionen und Rotation verstehen" },
      { title: "Beiträge & Zahlungen", desc: "Mobile Money, Überweisung, Bargeld, Zahlungspläne" },
      { title: "Darlehen & Kasse", desc: "Darlehen beantragen, Zinsen, Sicherheiten, Rückzahlung" },
      { title: "Vertrauensscore", desc: "Berechnung, Stufen, Abzeichen, Einspruch" },
      { title: "Vereine", desc: "Erstellungsassistent, A30/AMSED-Vorlagen, Vorstand, Satzung" },
      { title: "Sitzungen & Anwesenheit", desc: "Planung, Quorum, Vollmachten, Verspätungsstrafen" },
      { title: "Sozialhilfe", desc: "Kategorien, Obergrenzen, Nachweise, Vorstandsbeschluss" },
      { title: "Sicherheit & Datenschutz", desc: "Authentifizierung, personenbezogene Daten, DSGVO" },
    ],
    faqTitle: "Häufige Fragen",
    faqs: [
      { q: "Wie trete ich einer bestehenden Tontine bei?", a: "Fragen Sie den Vorsitzenden nach dem Einladungscode. Gehen Sie zu „Meine Vereine“ → „Beitreten“ und geben Sie den Code ein. Der Vorstand bestätigt Ihre Mitgliedschaft." },
      { q: "Wie zahle ich meinen Beitrag per Mobile Money?", a: "Klicken Sie auf der Beitragsseite auf „Zahlen“, wählen Sie Mobile Money und folgen Sie den Anweisungen. Die Quittung wird automatisch erstellt." },
      { q: "Was passiert, wenn ich eine Sitzung verpasse?", a: "Es gilt eine Strafe gemäß Satzung. Sie können sie durch eine Vollmacht oder einen vom Vorstand genehmigten Nachweis vermeiden." },
      { q: "Mein Vertrauensscore ist gesunken – warum?", a: "Änderungen werden im Score-Verlauf (Gamification-Seite) erklärt: verspäteter Beitrag, unentschuldigtes Fehlen, nicht zurückgezahltes Darlehen. Einspruch ist über das Formular möglich." },
      { q: "Kann ich mehrere Vereine erstellen?", a: "Ja, unbegrenzt. Jeder Verein ist unabhängig mit eigenem Vorstand, eigenen Aktivitäten und Scoring." },
    ],
    moreTitle: "Brauchen Sie weitere Hilfe?",
    cards: [
      { title: "Akademie", desc: "Vollständiges Benutzerhandbuch", cta: "Öffnen →", href: "/academie" },
      { title: "Community-Chat", desc: "Fragen Sie Ihre Gruppe", cta: "Öffnen →", href: "/chat" },
      { title: "Support-E-Mail", desc: "support@tchoua.app", cta: "Kontakt →", href: "mailto:support@tchoua.app" },
    ],
  },
} as const;
