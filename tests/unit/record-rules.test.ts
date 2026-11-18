import { evaluateDomain, filterRecordsByRules, parseDomain } from "@/lib/record-rules";

describe("règles d'enregistrement Odoo", () => {
  it("évalue les conditions simples et les opérateurs", () => {
    expect(evaluateDomain({ status: "ACTIVE", country: "CM" }, parseDomain('[["status","=","ACTIVE"],["country","=","CM"]]'))).toBe(true);
    expect(evaluateDomain({ status: "DRAFT", country: "CM" }, parseDomain('[["status","=","ACTIVE"]]'))).toBe(false);
    expect(evaluateDomain({ amount: 150000 }, parseDomain('[["amount",">",100000]]'))).toBe(true);
    expect(evaluateDomain({ status: "ACTIVE" }, [["status", "in", ["ACTIVE", "PENDING"]]])).toBe(true);
    expect(parseDomain("[]")).toEqual([]);
  });

  it("combine les règles globales en AND et les règles de rôle en OR", () => {
    const rules = [
      { id: "g1", name: "Global", resource: "ASSOCIATIONS", domain: '[["status","=","ACTIVE"]]', operations: "READ", active: true, roleId: null, groupId: null },
      { id: "r1", name: "Pays", resource: "ASSOCIATIONS", domain: '[["country","=","CM"]]', operations: "READ", active: true, roleId: "role-1", groupId: null },
      { id: "r2", name: "Pays", resource: "ASSOCIATIONS", domain: '[["country","=","FR"]]', operations: "READ", active: true, roleId: "role-1", groupId: null },
    ];
    const records = [
      { id: "1", status: "ACTIVE", country: "CM" },
      { id: "2", status: "ACTIVE", country: "FR" },
      { id: "3", status: "DRAFT", country: "CM" },
    ];
    expect(filterRecordsByRules(records, rules).map((record) => record.id)).toEqual(["1", "2"]);
  });

  it("rejette un domaine qui n'est pas une liste JSON", () => {
    expect(() => parseDomain("{\"status\":\"ACTIVE\"}")).toThrow();
    expect(() => parseDomain('[["status"]]')).toThrow();
  });
});
