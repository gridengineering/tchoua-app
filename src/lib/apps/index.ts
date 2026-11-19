export const APP_SCOPES = ["ADMIN", "MEMBER", "ASSOCIATION"] as const;
export type AppScope = (typeof APP_SCOPES)[number];

export const APP_SCOPE_LABELS: Record<AppScope, string> = {
  ADMIN: "Administration",
  MEMBER: "Espace membre",
  ASSOCIATION: "Espace association",
};

export const APP_SCOPE_DESCRIPTIONS: Record<AppScope, string> = {
  ADMIN: "Extensions réservées aux administrateurs de la plateforme.",
  MEMBER: "Applications qui étendent l'espace personnel de chaque membre.",
  ASSOCIATION: "Applications réservées au fondateur et aux membres du bureau d'une association.",
};

export const APP_SCOPE_ICONS: Record<AppScope, string> = {
  ADMIN: "🛡️",
  MEMBER: "👤",
  ASSOCIATION: "🏛️",
};

export const BUREAU_ROLES = new Set([
  "FOUNDER",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "SECRETARY_ASSISTANT",
  "SECRETARY_ADJ",
  "TREASURER",
  "TREASURER_ASSISTANT",
  "TREASURER_ADJ",
  "SOLIDARITY_OFFICER",
  "SOLIDARITY_MANAGER",
  "AUDITOR",
  "CENSOR",
  "NATURE_MANAGER",
]);

export function isAppScope(value: unknown): value is AppScope {
  return typeof value === "string" && (APP_SCOPES as readonly string[]).includes(value);
}

export function isBureauRole(role?: string | null): boolean {
  return BUREAU_ROLES.has(String(role ?? "").toUpperCase());
}

export function parseAppJson<T = any>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export type AppManifest = {
  schemaVersion?: string;
  slug?: string;
  name?: string;
  scope?: AppScope;
  version?: string;
  entryUrl?: string;
  icon?: string;
  permissions?: string[];
  settings?: Array<{ key: string; label: string; type?: string; required?: boolean }>;
  events?: string[];
};

export function normalizeApp(app: any, installations: any[] = []) {
  const manifest = parseAppJson<AppManifest>(app.manifest, {});
  return {
    ...app,
    manifest,
    permissions: parseAppJson<string[]>(app.permissions, manifest.permissions ?? []),
    screenshots: parseAppJson<string[]>(app.screenshots, []),
    descriptionHtml: app.descriptionHtml ?? null,
    descriptionUrl: app.descriptionUrl ?? null,
    entryUrl: manifest.entryUrl ?? app.homepageUrl ?? null,
    installed: installations.some((installation) => installation.appId === app.id && installation.status === "ACTIVE"),
    installation: installations.find((installation) => installation.appId === app.id) ?? null,
  };
}

export function safeAppSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
