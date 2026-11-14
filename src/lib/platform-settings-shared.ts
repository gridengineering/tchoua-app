export type PlatformSettings = {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  primaryColor: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: "XAF" | "EUR" | "USD" | "GBP";
  timezone: string;
  languages: string[];
  dateFormat: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxAssociationsPerMember: number;
  maxMembersPerAssociation: number;
  maxLoansPerMember: number;
  defaultCommissionRate: number;
  defaultLoanRate: number;
  latePenaltyPercent: number;
  features: {
    marketplace: boolean;
    academy: boolean;
    chat: boolean;
    ai: boolean;
    gamification: boolean;
    events: boolean;
    templates: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    require2FAForAdmins: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    reminderOffsets: number[];
  };
  rtc: {
    enabled: boolean;
    videoEnabled: boolean;
    chatEnabled: boolean;
    jitsiUrl: string;
    jitsiAppId: string;
    jitsiJwtTtlMinutes: number;
    jitsiRoomPrefix: string;
    chatWsUrl: string;
    chatApiUrl: string;
    chatFileMaxMb: number;
    chatAllowedExtensions: string[];
    turnUrls: string[];
    stunUrl: string;
    requireKycLevel: number;
    bureauChannelEnabled: boolean;
  };
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: "TCHOUA",
  siteTagline: "La Solidarité, Digitalisée.",
  logoUrl: "",
  primaryColor: "#0d3d28",
  supportEmail: "support@tchoua.com",
  supportPhone: "+237 600 000 000",
  defaultCurrency: "XAF",
  timezone: "Africa/Douala",
  languages: ["fr", "en"],
  dateFormat: "DD/MM/YYYY",
  allowRegistration: true,
  requireEmailVerification: false,
  maintenanceMode: false,
  maintenanceMessage: "La plateforme est en maintenance. Merci de revenir dans quelques minutes.",
  maxAssociationsPerMember: 10,
  maxMembersPerAssociation: 500,
  maxLoansPerMember: 2,
  defaultCommissionRate: 1.5,
  defaultLoanRate: 2,
  latePenaltyPercent: 10,
  features: {
    marketplace: true,
    academy: true,
    chat: true,
    ai: true,
    gamification: true,
    events: true,
    templates: true,
  },
  security: {
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    require2FAForAdmins: false,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    reminderOffsets: [3, 1, 0],
  },
  rtc: {
    enabled: true,
    videoEnabled: true,
    chatEnabled: true,
    jitsiUrl: "https://meet.tchoua.com",
    jitsiAppId: "tchoua",
    jitsiJwtTtlMinutes: 60,
    jitsiRoomPrefix: "assoc",
    chatWsUrl: "wss://chat.tchoua.com/connection/websocket",
    chatApiUrl: "https://chat.tchoua.com",
    chatFileMaxMb: 20,
    chatAllowedExtensions: ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx", "xls", "xlsx", "txt"],
    turnUrls: ["turn:turn.tchoua.com:3478?transport=udp", "turn:turn.tchoua.com:3478?transport=tcp"],
    stunUrl: "stun:turn.tchoua.com:3478",
    requireKycLevel: 1,
    bureauChannelEnabled: true,
  },
};

export const SETTINGS_KEY = "PLATFORM_CONFIG";

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSettings(
  base: PlatformSettings,
  patch: Record<string, any>
): PlatformSettings {
  const result: any = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in base)) continue;
    if (isObject(value) && isObject((base as any)[key])) {
      result[key] = { ...(base as any)[key], ...value };
    } else if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as PlatformSettings;
}


export function toPublicSettings(settings: PlatformSettings) {
  return {
    siteName: settings.siteName,
    siteTagline: settings.siteTagline,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    defaultCurrency: settings.defaultCurrency,
    timezone: settings.timezone,
    languages: settings.languages,
    allowRegistration: settings.allowRegistration,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    features: settings.features,
  };
}
