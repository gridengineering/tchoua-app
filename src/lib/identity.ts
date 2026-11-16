export type CountryOption = {
  code: string;
  name: string;
  dial: string;
  timezone?: string;
  city?: string;
};

/** Indicatifs utiles pour les pays de la zone CEMAC et la diaspora. */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "AF", name: "Afghanistan", dial: "93" },
  { code: "ZA", name: "Afrique du Sud", dial: "27" },
  { code: "AX", name: "Åland", dial: "358" },
  { code: "AL", name: "Albanie", dial: "355" },
  { code: "DZ", name: "Algérie", dial: "213", timezone: "Africa/Algiers", city: "Alger" },
  { code: "DE", name: "Allemagne", dial: "49", timezone: "Europe/Berlin", city: "Berlin" },
  { code: "AD", name: "Andorre", dial: "376" },
  { code: "AO", name: "Angola", dial: "244" },
  { code: "AI", name: "Anguilla", dial: "1" },
  { code: "AG", name: "Antigua-et-Barbuda", dial: "1" },
  { code: "SA", name: "Arabie Saoudite", dial: "966" },
  { code: "AR", name: "Argentine", dial: "54" },
  { code: "AM", name: "Arménie", dial: "374" },
  { code: "AW", name: "Aruba", dial: "297" },
  { code: "AC", name: "Ascension", dial: "247" },
  { code: "AU", name: "Australie", dial: "61" },
  { code: "AT", name: "Autriche", dial: "43" },
  { code: "AZ", name: "Azerbaïdjan", dial: "994" },
  { code: "BS", name: "Bahamas", dial: "1" },
  { code: "BH", name: "Bahreïn", dial: "973" },
  { code: "BD", name: "Bangladesh", dial: "880" },
  { code: "BB", name: "Barbade", dial: "1" },
  { code: "BE", name: "Belgique", dial: "32", timezone: "Europe/Brussels", city: "Bruxelles" },
  { code: "BZ", name: "Belize", dial: "501" },
  { code: "BJ", name: "Bénin", dial: "229", timezone: "Africa/Porto-Novo", city: "Cotonou" },
  { code: "BM", name: "Bermudes", dial: "1" },
  { code: "BT", name: "Bhoutan", dial: "975" },
  { code: "BY", name: "Biélorussie", dial: "375" },
  { code: "BO", name: "Bolivie", dial: "591" },
  { code: "BQ", name: "Bonaire, Saint-Eustache et Saba", dial: "599" },
  { code: "BA", name: "Bosnie-Herzégovine", dial: "387" },
  { code: "BW", name: "Botswana", dial: "267" },
  { code: "BR", name: "Brésil", dial: "55" },
  { code: "BN", name: "Brunei Darussalam", dial: "673" },
  { code: "BG", name: "Bulgarie", dial: "359" },
  { code: "BF", name: "Burkina Faso", dial: "226", timezone: "Africa/Ouagadougou", city: "Ouagadougou" },
  { code: "BI", name: "Burundi", dial: "257" },
  { code: "KH", name: "Cambodge", dial: "855" },
  { code: "CM", name: "Cameroun", dial: "237", timezone: "Africa/Douala", city: "Douala" },
  { code: "CA", name: "Canada", dial: "1", timezone: "America/Toronto", city: "Toronto" },
  { code: "CV", name: "Cap-Vert", dial: "238" },
  { code: "CL", name: "Chili", dial: "56" },
  { code: "CN", name: "Chine", dial: "86" },
  { code: "CY", name: "Chypre", dial: "357" },
  { code: "CO", name: "Colombie", dial: "57" },
  { code: "KM", name: "Comores", dial: "269" },
  { code: "KP", name: "Corée du Nord", dial: "850" },
  { code: "KR", name: "Corée du Sud", dial: "82" },
  { code: "CR", name: "Costa Rica", dial: "506" },
  { code: "CI", name: "Côte-d'Ivoire", dial: "225", timezone: "Africa/Abidjan", city: "Abidjan" },
  { code: "HR", name: "Croatie", dial: "385" },
  { code: "CU", name: "Cuba", dial: "53" },
  { code: "CW", name: "Curaçao", dial: "599" },
  { code: "DK", name: "Danemark", dial: "45" },
  { code: "DJ", name: "Djibouti", dial: "253" },
  { code: "DM", name: "Dominique", dial: "1" },
  { code: "EG", name: "Égypte", dial: "20" },
  { code: "SV", name: "El Salvador", dial: "503" },
  { code: "AE", name: "Émirats Arabes Unis", dial: "971" },
  { code: "EC", name: "Équateur", dial: "593" },
  { code: "ER", name: "Érythrée", dial: "291" },
  { code: "ES", name: "Espagne", dial: "34", timezone: "Europe/Madrid", city: "Madrid" },
  { code: "EE", name: "Estonie", dial: "372" },
  { code: "US", name: "États-Unis d'Amérique", dial: "1", timezone: "America/New_York", city: "New York" },
  { code: "ET", name: "Éthiopie", dial: "251" },
  { code: "FJ", name: "Fidji", dial: "679" },
  { code: "FI", name: "Finlande", dial: "358" },
  { code: "FR", name: "France", dial: "33", timezone: "Europe/Paris", city: "Paris" },
  { code: "GA", name: "Gabon", dial: "241", timezone: "Africa/Libreville", city: "Libreville" },
  { code: "GM", name: "Gambie", dial: "220" },
  { code: "GE", name: "Géorgie", dial: "995" },
  { code: "GH", name: "Ghana", dial: "233" },
  { code: "GI", name: "Gibraltar", dial: "350" },
  { code: "GR", name: "Grèce", dial: "30" },
  { code: "GD", name: "Grenade", dial: "1" },
  { code: "GL", name: "Groenland", dial: "299" },
  { code: "GP", name: "Guadeloupe", dial: "590" },
  { code: "GU", name: "Guam", dial: "1" },
  { code: "GT", name: "Guatemala", dial: "502" },
  { code: "GG", name: "Guernesey", dial: "44" },
  { code: "GN", name: "Guinée", dial: "224" },
  { code: "GQ", name: "Guinée équatoriale", dial: "240", timezone: "Africa/Malabo", city: "Malabo" },
  { code: "GW", name: "Guinée-Bissau", dial: "245" },
  { code: "GY", name: "Guyana", dial: "592" },
  { code: "GF", name: "Guyane française", dial: "594" },
  { code: "HT", name: "Haïti", dial: "509" },
  { code: "HN", name: "Honduras", dial: "504" },
  { code: "HK", name: "Hong Kong", dial: "852" },
  { code: "HU", name: "Hongrie", dial: "36" },
  { code: "CX", name: "Île Christmas", dial: "61" },
  { code: "IM", name: "Île de Man", dial: "44" },
  { code: "NF", name: "Île Norfolk", dial: "672" },
  { code: "KY", name: "Îles Caïmans", dial: "1" },
  { code: "CC", name: "Îles Cocos", dial: "61" },
  { code: "CK", name: "Îles Cook", dial: "682" },
  { code: "FO", name: "Îles Féroé", dial: "298" },
  { code: "FK", name: "Îles Malouines", dial: "500" },
  { code: "MP", name: "Îles Mariannes du Nord", dial: "1" },
  { code: "MH", name: "Îles Marshall", dial: "692" },
  { code: "SB", name: "Îles Salomon", dial: "677" },
  { code: "TC", name: "Îles Turques-et-Caïques", dial: "1" },
  { code: "VI", name: "Îles vierges américaines", dial: "1" },
  { code: "VG", name: "Îles vierges britanniques", dial: "1" },
  { code: "IN", name: "Inde", dial: "91" },
  { code: "ID", name: "Indonésie", dial: "62" },
  { code: "IQ", name: "Irak", dial: "964" },
  { code: "IR", name: "Iran", dial: "98" },
  { code: "IE", name: "Irlande", dial: "353" },
  { code: "IS", name: "Islande", dial: "354" },
  { code: "IL", name: "Israël", dial: "972" },
  { code: "IT", name: "Italie", dial: "39", timezone: "Europe/Rome", city: "Rome" },
  { code: "JM", name: "Jamaïque", dial: "1" },
  { code: "JP", name: "Japon", dial: "81" },
  { code: "JE", name: "Jersey", dial: "44" },
  { code: "JO", name: "Jordanie", dial: "962" },
  { code: "KZ", name: "Kazakhstan", dial: "7" },
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "KG", name: "Kirghizistan", dial: "996" },
  { code: "KI", name: "Kiribati", dial: "686" },
  { code: "XK", name: "Kosovo", dial: "383" },
  { code: "KW", name: "Koweït", dial: "965" },
  { code: "LA", name: "Laos", dial: "856" },
  { code: "LS", name: "Lesotho", dial: "266" },
  { code: "LV", name: "Lettonie", dial: "371" },
  { code: "LB", name: "Liban", dial: "961" },
  { code: "LR", name: "Libéria", dial: "231" },
  { code: "LY", name: "Libye", dial: "218" },
  { code: "LI", name: "Liechtenstein", dial: "423" },
  { code: "LT", name: "Lituanie", dial: "370" },
  { code: "LU", name: "Luxembourg", dial: "352" },
  { code: "MO", name: "Macao", dial: "853" },
  { code: "MK", name: "Macédoine du Nord", dial: "389" },
  { code: "MG", name: "Madagascar", dial: "261" },
  { code: "MY", name: "Malaisie", dial: "60" },
  { code: "MW", name: "Malawi", dial: "265" },
  { code: "MV", name: "Maldives", dial: "960" },
  { code: "ML", name: "Mali", dial: "223", timezone: "Africa/Bamako", city: "Bamako" },
  { code: "MT", name: "Malte", dial: "356" },
  { code: "MA", name: "Maroc", dial: "212", timezone: "Africa/Casablanca", city: "Casablanca" },
  { code: "MQ", name: "Martinique", dial: "596" },
  { code: "MU", name: "Maurice", dial: "230" },
  { code: "MR", name: "Mauritanie", dial: "222" },
  { code: "YT", name: "Mayotte", dial: "262" },
  { code: "MX", name: "Mexique", dial: "52" },
  { code: "FM", name: "Micronésie", dial: "691" },
  { code: "MD", name: "Moldavie", dial: "373" },
  { code: "MC", name: "Monaco", dial: "377" },
  { code: "MN", name: "Mongolie", dial: "976" },
  { code: "ME", name: "Monténégro", dial: "382" },
  { code: "MS", name: "Montserrat", dial: "1" },
  { code: "MZ", name: "Mozambique", dial: "258" },
  { code: "MM", name: "Myanmar", dial: "95" },
  { code: "NA", name: "Namibie", dial: "264" },
  { code: "NR", name: "Nauru", dial: "674" },
  { code: "NP", name: "Népal", dial: "977" },
  { code: "NI", name: "Nicaragua", dial: "505" },
  { code: "NE", name: "Niger", dial: "227" },
  { code: "NG", name: "Nigéria", dial: "234", timezone: "Africa/Lagos", city: "Lagos" },
  { code: "NU", name: "Niué", dial: "683" },
  { code: "NO", name: "Norvège", dial: "47" },
  { code: "NC", name: "Nouvelle-Calédonie", dial: "687" },
  { code: "NZ", name: "Nouvelle-Zélande", dial: "64" },
  { code: "IO", name: "Océan Indien Britannique", dial: "246" },
  { code: "OM", name: "Oman", dial: "968" },
  { code: "UG", name: "Ouganda", dial: "256" },
  { code: "UZ", name: "Ouzbékistan", dial: "998" },
  { code: "PK", name: "Pakistan", dial: "92" },
  { code: "PW", name: "Palaos", dial: "680" },
  { code: "PS", name: "Palestine", dial: "970" },
  { code: "PA", name: "Panama", dial: "507" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", dial: "675" },
  { code: "PY", name: "Paraguay", dial: "595" },
  { code: "NL", name: "Pays-Bas", dial: "31" },
  { code: "PE", name: "Pérou", dial: "51" },
  { code: "PH", name: "Philippines", dial: "63" },
  { code: "PL", name: "Pologne", dial: "48" },
  { code: "PF", name: "Polynésie française", dial: "689" },
  { code: "PR", name: "Porto Rico", dial: "1" },
  { code: "PT", name: "Portugal", dial: "351" },
  { code: "QA", name: "Qatar", dial: "974" },
  { code: "CF", name: "République Centrafricaine", dial: "236", timezone: "Africa/Bangui", city: "Bangui" },
  { code: "CD", name: "République démocratique du Congo", dial: "243" },
  { code: "DO", name: "République Dominicaine", dial: "1" },
  { code: "CG", name: "République du Congo", dial: "242", timezone: "Africa/Brazzaville", city: "Brazzaville" },
  { code: "CZ", name: "République Tchèque", dial: "420" },
  { code: "TZ", name: "République unie de Tanzanie", dial: "255" },
  { code: "RE", name: "Réunion", dial: "262" },
  { code: "RO", name: "Roumanie", dial: "40" },
  { code: "SZ", name: "Royaume d'Eswatini", dial: "268" },
  { code: "GB", name: "Royaume-Uni", dial: "44", timezone: "Europe/London", city: "Londres" },
  { code: "RU", name: "Russie", dial: "7" },
  { code: "RW", name: "Rwanda", dial: "250" },
  { code: "EH", name: "Sahara occidental", dial: "212" },
  { code: "BL", name: "Saint-Barthélemy", dial: "590" },
  { code: "KN", name: "Saint-Christophe-et-Niévès", dial: "1" },
  { code: "SM", name: "Saint-Marin", dial: "378" },
  { code: "MF", name: "Saint-Martin (partie française)", dial: "590" },
  { code: "SX", name: "Saint-Martin (partie néerlandaise)", dial: "1" },
  { code: "PM", name: "Saint-Pierre-et-Miquelon", dial: "508" },
  { code: "VA", name: "Saint-Siège (Vatican)", dial: "39" },
  { code: "VC", name: "Saint-Vincent-et-les-Grenadines", dial: "1" },
  { code: "SH", name: "Sainte-Hélène", dial: "290" },
  { code: "LC", name: "Sainte-Lucie", dial: "1" },
  { code: "WS", name: "Samoa", dial: "685" },
  { code: "AS", name: "Samoa américaines", dial: "1" },
  { code: "ST", name: "São Tomé-et-Principe", dial: "239" },
  { code: "SN", name: "Sénégal", dial: "221", timezone: "Africa/Dakar", city: "Dakar" },
  { code: "RS", name: "Serbie", dial: "381" },
  { code: "SC", name: "Seychelles", dial: "248" },
  { code: "SL", name: "Sierra Leone", dial: "232" },
  { code: "SG", name: "Singapour", dial: "65" },
  { code: "SK", name: "Slovaquie", dial: "421" },
  { code: "SI", name: "Slovénie", dial: "386" },
  { code: "SO", name: "Somalie", dial: "252" },
  { code: "SD", name: "Soudan", dial: "249" },
  { code: "SS", name: "Soudan du Sud", dial: "211" },
  { code: "LK", name: "Sri Lanka", dial: "94" },
  { code: "SE", name: "Suède", dial: "46" },
  { code: "CH", name: "Suisse", dial: "41", timezone: "Europe/Zurich", city: "Genève" },
  { code: "SR", name: "Suriname", dial: "597" },
  { code: "SJ", name: "Svalbard et Île Jan Mayen", dial: "47" },
  { code: "SY", name: "Syrie", dial: "963" },
  { code: "TJ", name: "Tadjikistan", dial: "992" },
  { code: "TW", name: "Taïwan", dial: "886" },
  { code: "TD", name: "Tchad", dial: "235", timezone: "Africa/Ndjamena", city: "N'Djamena" },
  { code: "TH", name: "Thaïlande", dial: "66" },
  { code: "TL", name: "Timor-Leste", dial: "670" },
  { code: "TG", name: "Togo", dial: "228", timezone: "Africa/Lome", city: "Lomé" },
  { code: "TK", name: "Tokelau", dial: "690" },
  { code: "TO", name: "Tonga", dial: "676" },
  { code: "TT", name: "Trinité-et-Tobago", dial: "1" },
  { code: "TA", name: "Tristan da Cunha", dial: "290" },
  { code: "TN", name: "Tunisie", dial: "216", timezone: "Africa/Tunis", city: "Tunis" },
  { code: "TM", name: "Turkménistan", dial: "993" },
  { code: "TR", name: "Turquie", dial: "90" },
  { code: "TV", name: "Tuvalu", dial: "688" },
  { code: "UA", name: "Ukraine", dial: "380" },
  { code: "UY", name: "Uruguay", dial: "598" },
  { code: "VU", name: "Vanuatu", dial: "678" },
  { code: "VE", name: "Venezuela", dial: "58" },
  { code: "VN", name: "Vietnam", dial: "84" },
  { code: "WF", name: "Wallis-et-Futuna", dial: "681" },
  { code: "YE", name: "Yémen", dial: "967" },
  { code: "ZM", name: "Zambie", dial: "260" },
  { code: "ZW", name: "Zimbabwe", dial: "263" },
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
