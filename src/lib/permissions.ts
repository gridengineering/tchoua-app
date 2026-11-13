// Catalogue de permissions et helpers d'autorisation pour les associations.

export const SUPER_ADMIN_EMAIL = "admin@tchoua.com";

export const PERMISSIONS = {
  EDIT_SETTINGS: "Modifier les paramètres",
  INVITE_MEMBERS: "Inviter des membres",
  MANAGE_MEMBERS: "Gérer les membres (rôle, statut)",
  CREATE_ACTIVITY: "Créer une activité",
  MANAGE_ACTIVITIES: "Gérer les activités",
  APPROVE_AIDS: "Approuver les aides sociales",
  MANAGE_LOANS: "Gérer les prêts",
  VIEW_FINANCES: "Voir les finances",
  MANAGE_MEETINGS: "Gérer les réunions",
  MANAGE_ROLES: "Gérer les rôles personnalisés",
  DELETE_ASSOCIATION: "Dissoudre l'association",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

// Rôles de base et permissions par défaut
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  FOUNDER: ALL_PERMISSIONS,
  PRESIDENT: ALL_PERMISSIONS.filter((p) => p !== "DELETE_ASSOCIATION"),
  VICE_PRESIDENT: [
    "EDIT_SETTINGS", "INVITE_MEMBERS", "MANAGE_MEMBERS",
    "CREATE_ACTIVITY", "MANAGE_ACTIVITIES", "APPROVE_AIDS",
    "MANAGE_LOANS", "VIEW_FINANCES", "MANAGE_MEETINGS", "MANAGE_ROLES",
  ],
  SECRETARY: ["EDIT_SETTINGS", "INVITE_MEMBERS", "MANAGE_MEMBERS", "VIEW_FINANCES", "MANAGE_MEETINGS", "MANAGE_ACTIVITIES"],
  TREASURER: ["VIEW_FINANCES", "MANAGE_LOANS", "APPROVE_AIDS", "MANAGE_ACTIVITIES"],
  SOLIDARITY_OFFICER: ["APPROVE_AIDS", "VIEW_FINANCES"],
  MEMBER: [],
};

export type Membership = {
  role: string;
  customRoleId?: string | null;
  customRole?: { permissions: string } | null;
};

export type SessionLike = { user?: { email?: string | null; id?: string } | null } | null;

export function isSuperAdmin(session: SessionLike): boolean {
  return session?.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function parsePermissions(json: string | null | undefined): Permission[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter((p): p is Permission => typeof p === "string" && p in PERMISSIONS);
  } catch {
    return [];
  }
}

export function permissionsForMembership(m: Membership | null | undefined): Permission[] {
  if (!m) return [];
  const base = ROLE_PERMISSIONS[m.role] ?? [];
  const custom = m.customRole ? parsePermissions(m.customRole.permissions) : [];
  return Array.from(new Set([...base, ...custom]));
}

export function hasPermission(
  session: SessionLike,
  membership: Membership | null | undefined,
  perm: Permission
): boolean {
  if (isSuperAdmin(session)) return true;
  if (!membership) return false;
  if (membership.role === "FOUNDER") return true; // créateur : tous droits à vie
  return permissionsForMembership(membership).includes(perm);
}
