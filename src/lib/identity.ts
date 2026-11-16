export type CountryOption = {
  code: string;
  name: string;
  dial: string;
  timezone?: string;
  city?: string;
};

/** Indicatifs utiles pour les pays de la zone CEMAC et la diaspora. */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "CM", name: "Cameroun", dial: "237", timezone: "Africa/Douala", city: "Douala" },
  { code: "CF", name: "République centrafricaine", dial: "236", timezone: "Africa/Bangui", city: "Bangui" },
  { code: "TD", name: "Tchad", dial: "235", timezone: "Africa/Ndjamena", city: "N'Djamena" },
  { code: "CG", name: "Congo", dial: "242", timezone: "Africa/Brazzaville", city: "Brazzaville" },
  { code: "GA", name: "Gabon", dial: "241", timezone: "Africa/Libreville", city: "Libreville" },
  { code: "GQ", name: "Guinée équatoriale", dial: "240", timezone: "Africa/Malabo", city: "Malabo" },
  { code: "CI", name: "Côte d’Ivoire", dial: "225", timezone: "Africa/Abidjan", city: "Abidjan" },
  { code: "SN", name: "Sénégal", dial: "221", timezone: "Africa/Dakar", city: "Dakar" },
  { code: "ML", name: "Mali", dial: "223", timezone: "Africa/Bamako", city: "Bamako" },
  { code: "BF", name: "Burkina Faso", dial: "226", timezone: "Africa/Ouagadougou", city: "Ouagadougou" },
  { code: "BJ", name: "Bénin", dial: "229", timezone: "Africa/Porto-Novo", city: "Cotonou" },
  { code: "TG", name: "Togo", dial: "228", timezone: "Africa/Lome", city: "Lomé" },
  { code: "NG", name: "Nigéria", dial: "234", timezone: "Africa/Lagos", city: "Lagos" },
  { code: "FR", name: "France", dial: "33", timezone: "Europe/Paris", city: "Paris" },
  { code: "BE", name: "Belgique", dial: "32", timezone: "Europe/Brussels", city: "Bruxelles" },
  { code: "CA", name: "Canada", dial: "1", timezone: "America/Toronto", city: "Toronto" },
  { code: "US", name: "États-Unis", dial: "1", timezone: "America/New_York", city: "New York" },
  { code: "GB", name: "Royaume-Uni", dial: "44", timezone: "Europe/London", city: "Londres" },
  { code: "CH", name: "Suisse", dial: "41", timezone: "Europe/Zurich", city: "Genève" },
  { code: "DE", name: "Allemagne", dial: "49", timezone: "Europe/Berlin", city: "Berlin" },
  { code: "ES", name: "Espagne", dial: "34", timezone: "Europe/Madrid", city: "Madrid" },
  { code: "IT", name: "Italie", dial: "39", timezone: "Europe/Rome", city: "Rome" },
  { code: "MA", name: "Maroc", dial: "212", timezone: "Africa/Casablanca", city: "Casablanca" },
  { code: "DZ", name: "Algérie", dial: "213", timezone: "Africa/Algiers", city: "Alger" },
  { code: "TN", name: "Tunisie", dial: "216", timezone: "Africa/Tunis", city: "Tunis" },
];

export const SUPPORTED_LANGUAGES = ["fr", "en", "es", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(value: unknown): SupportedLanguage {
  const lang = String(value ?? "").trim().toLowerCase().slice(0, 2);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang) ? (lang as SupportedLanguage) : "fr";
}

export function countryByCode(code: string | undefined | null): CountryOption {
  return COUNTRY_OPTIONS.find((item) => item.code === String(code ?? "").toUpperCase()) ?? COUNTRY_OPTIONS[0];
}

export function countryByDial(dial: string | undefined | null): CountryOption | undefined {
  const clean = String(dial ?? "").replace(/\D/g, "");
  return COUNTRY_OPTIONS.find((item) => item.dial === clean && clean !== "1") ?? COUNTRY_OPTIONS.find((item) => item.dial === clean);
}

export function isEmailIdentifier(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Normalise un numéro au format international sans « + ».
 * Exemples : 237677112255, +237 677 11 22 55, 0677112255 avec l'indicatif 237.
 */
export function normalizePhone(raw: unknown, defaultDial = ""): string | undefined {
  const input = String(raw ?? "").trim();
  if (!input) return undefined;

  const digits = input.replace(/\D/g, "");
  if (!digits) return undefined;

  let normalized = digits;
  if (input.startsWith("+")) {
    normalized = digits;
  } else if (normalized.startsWith("00")) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith("0")) {
    normalized = `${defaultDial}${normalized.replace(/^0+/, "")}`;
  } else if (defaultDial && normalized.length <= 10) {
    // Numéro national sans indicatif : on ajoute l'indicatif choisi.
    // Au-delà de 10 chiffres, on considère que l'indicatif est déjà présent.
    normalized = `${defaultDial}${normalized}`;
  }

  // Un numéro international complet (indicatif déjà présent) reste accepté
  // même sans indicatif séparé : 237677112255, 33612345678, 14155552671…
  if (!defaultDial && !input.startsWith("+") && normalized.length < 10) {
    return undefined;
  }
  return normalized.length >= 8 && normalized.length <= 15 ? normalized : undefined;
}

export function phoneLookupValues(phone: string): string[] {
  const digits = phone.replace(/\D/g, "");
  return Array.from(new Set([digits, `+${digits}`]));
}

export function normalizeDialCode(raw: unknown): string | undefined {
  const digits = String(raw ?? "").replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 1 && digits.length <= 4 ? digits : undefined;
}

export function detectLocaleDefaults(timeZone?: string, browserLanguage?: string): {
  country?: CountryOption;
  city: string;
  language: SupportedLanguage;
} {
  const tz = String(timeZone ?? "");
  const match = COUNTRY_OPTIONS.find((item) => item.timezone === tz);
  const language = normalizeLanguage(browserLanguage);
  return {
    country: match,
    city: match?.city ?? "",
    language,
  };
}
