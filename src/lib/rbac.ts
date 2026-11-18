export const ADMIN_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export const ADMIN_RESOURCES = [
  "DASHBOARD",
  "USERS",
  "ASSOCIATIONS",
  "TRANSACTIONS",
  "WALLETS",
  "FINANCE",
  "KYC",
  "TEMPLATES",
  "AUDIT",
  "SETTINGS",
  "ROLES",
  "NOTIFICATIONS",
  "ARP",
] as const;

export const RESOURCE_LABELS: Record<string, string> = {
  DASHBOARD: "Tableau de bord",
  USERS: "Utilisateurs système",
  ASSOCIATIONS: "Associations",
  TRANSACTIONS: "Transactions",
  WALLETS: "Wallets & paiements",
  FINANCE: "Finance & audit",
  KYC: "Conformité KYC",
  TEMPLATES: "Modèles d'association",
  AUDIT: "Journaux d'audit",
  SETTINGS: "Paramètres plateforme",
  ROLES: "Rôles, groupes & règles",
  NOTIFICATIONS: "Notifications",
  ARP: "Référentiel ARP",
};

export const ACTION_LABELS: Record<AdminAction, string> = {
  CREATE: "Créer",
  READ: "Lire",
  UPDATE: "Modifier",
  DELETE: "Supprimer",
};

export const RECORD_RULE_OPERATIONS = ["READ", "WRITE", "CREATE", "DELETE"] as const;
export type RecordRuleOperation = (typeof RECORD_RULE_OPERATIONS)[number];

export function permissionKey(resource: string, action: string) {
  return `${resource}_${action}`;
}

export function parsePermissionKey(key: string): { resource: string; action: string } | null {
  const action = ADMIN_ACTIONS.find((candidate) => key.endsWith(`_${candidate}`));
  if (!action) return null;
  const resource = key.slice(0, -(action.length + 1));
  return resource ? { resource, action } : null;
}

export function normalizeOperations(value: unknown): RecordRuleOperation[] {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(",");
  const operations = raw
    .map((item) => String(item).trim().toUpperCase())
    .filter((item): item is RecordRuleOperation =>
      RECORD_RULE_OPERATIONS.includes(item as RecordRuleOperation)
    );
  return operations.length ? Array.from(new Set(operations)) : ["READ"];
}

export function templatePermissionKeys(template: string): string[] {
  if (template === "READ_ONLY") {
    return ADMIN_RESOURCES.flatMap((resource) => [permissionKey(resource, "READ")]);
  }
  if (template === "AUDITOR") {
    return ["DASHBOARD_READ", "AUDIT_READ", "ASSOCIATIONS_READ", "TRANSACTIONS_READ", "FINANCE_READ", "USERS_READ"]
      .map(String);
  }
  if (template === "OPERATOR") {
    return ADMIN_RESOURCES
      .filter((resource) => !["ROLES", "SETTINGS"].includes(resource))
      .flatMap((resource) => [permissionKey(resource, "READ"), permissionKey(resource, "CREATE"), permissionKey(resource, "UPDATE")]);
  }
  return [];
}
