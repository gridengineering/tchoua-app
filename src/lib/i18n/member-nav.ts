export type NavLang = "fr" | "en" | "es" | "de";

const LABELS: Record<string, Partial<Record<NavLang, string>>> = {
  "Pilotage": { fr: "Pilotage", en: "Overview", es: "Piloto", de: "Übersicht" },
  "Finances": { fr: "Finances", en: "Finances", es: "Finanzas", de: "Finanzen" },
  "Communauté": { fr: "Communauté", en: "Community", es: "Comunidad", de: "Gemeinschaft" },
  "Analyse & apprentissage": { fr: "Analyse & apprentissage", en: "Analysis & learning", es: "Análisis y aprendizaje", de: "Analyse & Lernen" },
  "Mon activité": { fr: "Mon activité", en: "My activity", es: "Mi actividad", de: "Meine Aktivität" },
  "Vie associative": { fr: "Vie associative", en: "Association life", es: "Vida asociativa", de: "Vereinsleben" },
  "Gestion & Bureau": { fr: "Gestion & Bureau", en: "Management & board", es: "Gestión y junta", de: "Verwaltung & Vorstand" },
  "Tableau de bord": { fr: "Tableau de bord", en: "Dashboard", es: "Panel", de: "Dashboard" },
  "Mon parcours": { fr: "Mon parcours", en: "My journey", es: "Mi recorrido", de: "Mein Weg" },
  "Mes associations": { fr: "Mes associations", en: "My associations", es: "Mis asociaciones", de: "Meine Vereine" },
  "Calendrier": { fr: "Calendrier", en: "Calendar", es: "Calendario", de: "Kalender" },
  "Vérification KYC": { fr: "Vérification KYC", en: "KYC verification", es: "Verificación KYC", de: "KYC-Prüfung" },
  "Tontines": { fr: "Tontines", en: "Tontines", es: "Tontinas", de: "Tontinen" },
  "Épargne": { fr: "Épargne", en: "Savings", es: "Ahorro", de: "Sparen" },
  "Prêts": { fr: "Prêts", en: "Loans", es: "Préstamos", de: "Darlehen" },
  "Solidarité": { fr: "Solidarité", en: "Solidarity", es: "Solidaridad", de: "Solidarität" },
  "Sessions": { fr: "Sessions", en: "Sessions", es: "Sesiones", de: "Sitzungen" },
  "Portefeuille": { fr: "Portefeuille", en: "Wallet", es: "Cartera", de: "Wallet" },
  "Membres": { fr: "Membres", en: "Members", es: "Miembros", de: "Mitglieder" },
  "Marketplace": { fr: "Marketplace", en: "Marketplace", es: "Marketplace", de: "Marktplatz" },
  "Événements": { fr: "Événements", en: "Events", es: "Eventos", de: "Veranstaltungen" },
  "Chat de groupe": { fr: "Chat de groupe", en: "Group chat", es: "Chat de grupo", de: "Gruppenchat" },
  "Rapports": { fr: "Rapports", en: "Reports", es: "Informes", de: "Berichte" },
  "Conseils IA": { fr: "Conseils IA", en: "AI advice", es: "Consejos IA", de: "KI-Ratgeber" },
  "Gamification": { fr: "Gamification", en: "Gamification", es: "Gamificación", de: "Gamification" },
  "Académie": { fr: "Académie", en: "Academy", es: "Academia", de: "Akademie" },
  "Vue d'ensemble": { fr: "Vue d'ensemble", en: "Overview", es: "Resumen", de: "Übersicht" },
  "Comptes & versements": { fr: "Comptes & versements", en: "Accounts & payments", es: "Cuentas y pagos", de: "Konten & Zahlungen" },
  "Activités": { fr: "Activités", en: "Activities", es: "Actividades", de: "Aktivitäten" },
  "Aides sociales": { fr: "Aides sociales", en: "Social aid", es: "Ayudas sociales", de: "Sozialhilfe" },
  "Réunions & sessions": { fr: "Réunions & sessions", en: "Meetings & sessions", es: "Reuniones y sesiones", de: "Treffen & Sitzungen" },
  "Rapports & finances": { fr: "Rapports & finances", en: "Reports & finances", es: "Informes y finanzas", de: "Berichte & Finanzen" },
  "Conformité KYC": { fr: "Conformité KYC", en: "KYC compliance", es: "Cumplimiento KYC", de: "KYC-Konformität" },
  "Configurer": { fr: "Configurer", en: "Configure", es: "Configurar", de: "Konfigurieren" },
  "Réglages association": { fr: "Réglages association", en: "Association settings", es: "Ajustes de la asociación", de: "Vereinseinstellungen" },
  "Informations": { fr: "Informations", en: "Information", es: "Información", de: "Informationen" },
  "Activités & cadres": { fr: "Activités & cadres", en: "Activities & frameworks", es: "Actividades y marcos", de: "Aktivitäten & Rahmen" },
  "Cadre ARP": { fr: "Cadre ARP", en: "ARP framework", es: "Marco ARP", de: "ARP-Rahmen" },
  "Sécurité & rôles": { fr: "Sécurité & rôles", en: "Security & roles", es: "Seguridad y roles", de: "Sicherheit & Rollen" },
};

export function navText(value: string, lang?: string | null): string {
  const key = (lang === "en" || lang === "es" || lang === "de" ? lang : "fr") as NavLang;
  return LABELS[value]?.[key] ?? value;
}
