import { prisma } from "@/lib/prisma";
import { normalizeOperations, type RecordRuleOperation } from "@/lib/rbac";

export type RecordRuleLike = {
  id: string;
  name: string;
  resource: string;
  domain: string;
  operations: string;
  active: boolean;
  roleId: string | null;
  groupId: string | null;
};

type DomainCondition = [string, string, unknown];
type DomainToken = DomainCondition | "&" | "|" | "!";

export function parseDomain(value: unknown): DomainToken[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value || "[]");
    } catch {
      throw new Error("Le domaine doit être un JSON valide.");
    }
  }
  if (!Array.isArray(parsed)) throw new Error("Le domaine doit être une liste JSON.");
  if (!parsed.length) return [];
  // Odoo accepte aussi une condition plate : ["pays", "=", "CM"].
  if (typeof parsed[0] === "string" && parsed.length >= 3) parsed = [parsed];

  const tokens: DomainToken[] = [];
  for (const item of parsed as unknown[]) {
    if (item === "&" || item === "|" || item === "!") {
      tokens.push(item);
      continue;
    }
    if (!Array.isArray(item) || item.length < 3) {
      throw new Error("Chaque condition doit être de la forme [champ, opérateur, valeur].");
    }
    const [field, operator, expected] = item;
    if (typeof field !== "string" || typeof operator !== "string") {
      throw new Error("Le champ et l'opérateur d'une condition doivent être des textes.");
    }
    tokens.push([field, operator.toLowerCase(), expected]);
  }
  return tokens;
}

function getField(record: any, path: string): unknown {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), record);
}

function sameValue(actual: unknown, expected: unknown): boolean {
  if (expected === null || expected === undefined) return actual === expected;
  if (typeof expected === "number") return Number(actual) === expected;
  if (typeof expected === "boolean") return Boolean(actual) === expected;
  return String(actual ?? "") === String(expected);
}

function conditionMatches(record: any, [field, operator, expected]: DomainCondition): boolean {
  const actual = getField(record, field);
  const text = String(actual ?? "");
  switch (operator) {
    case "=":
    case "==":
      return sameValue(actual, expected);
    case "!=":
    case "<>":
      return !sameValue(actual, expected);
    case ">":
      return Number(actual) > Number(expected);
    case ">=":
      return Number(actual) >= Number(expected);
    case "<":
      return Number(actual) < Number(expected);
    case "<=":
      return Number(actual) <= Number(expected);
    case "in":
      return Array.isArray(expected) && expected.some((item) => sameValue(actual, item));
    case "not in":
      return Array.isArray(expected) && !expected.some((item) => sameValue(actual, item));
    case "like":
      return text.includes(String(expected ?? ""));
    case "ilike":
      return text.toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "contains":
      return text.includes(String(expected ?? ""));
    case "not contains":
      return !text.includes(String(expected ?? ""));
    case "null":
      return actual === null || actual === undefined;
    case "not null":
      return actual !== null && actual !== undefined;
    default:
      return false;
  }
}

/**
 * Évalue un domaine Odoo simplifié. Les conditions successives sont combinées
 * avec AND ; les préfixes &, | et ! permettent de composer des expressions.
 */
export function evaluateDomain(record: any, domain: DomainToken[] | string): boolean {
  const tokens = typeof domain === "string" ? parseDomain(domain) : domain;
  if (!tokens.length) return true;

  let index = 0;
  const read = (): boolean => {
    const token = tokens[index++];
    if (token === "&") {
      const left = read();
      const right = read();
      return left && right;
    }
    if (token === "|") {
      const left = read();
      const right = read();
      return left || right;
    }
    if (token === "!") return !read();
    if (!token) return true;
    return conditionMatches(record, token);
  };

  let result = read();
  while (index < tokens.length) result = result && read();
  return result;
}

export async function getApplicableRecordRules(input: {
  roleId?: string | null;
  groupId?: string | null;
  resource: string;
  operation: RecordRuleOperation;
}): Promise<RecordRuleLike[]> {
  const rules = await prisma.systemRecordRule.findMany({
    where: {
      active: true,
      resource: input.resource,
      OR: [
        { roleId: null, groupId: null },
        ...(input.roleId ? [{ roleId: input.roleId }] : []),
        ...(input.groupId ? [{ groupId: input.groupId }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  return rules.filter((rule) => normalizeOperations(rule.operations).includes(input.operation));
}

/**
 * Applique les règles d'enregistrement à une liste. Les règles globales sont
 * cumulatives ; les règles de rôle/groupe sont alternatives (OR), comme dans
 * le moteur de groupes d'Odoo.
 */
export function filterRecordsByRules<T extends Record<string, any>>(
  records: T[],
  rules: RecordRuleLike[]
): T[] {
  if (!rules.length) return records;
  const global = rules.filter((rule) => !rule.roleId && !rule.groupId);
  const scoped = rules.filter((rule) => rule.roleId || rule.groupId);
  return records.filter((record) => {
    if (!global.every((rule) => evaluateDomain(record, rule.domain))) return false;
    if (!scoped.length) return true;
    return scoped.some((rule) => evaluateDomain(record, rule.domain));
  });
}

export function isRecordAllowed(record: any, rules: RecordRuleLike[]): boolean {
  if (!rules.length) return true;
  const global = rules.filter((rule) => !rule.roleId && !rule.groupId);
  const scoped = rules.filter((rule) => rule.roleId || rule.groupId);
  if (!global.every((rule) => evaluateDomain(record, rule.domain))) return false;
  if (!scoped.length) return true;
  return scoped.some((rule) => evaluateDomain(record, rule.domain));
}
