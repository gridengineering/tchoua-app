import { cashPolicy, isAssociationBureau, parseBankConfig } from "@/lib/association/member-account";

describe("politique cash et rôles du compte association", () => {
  it("désactive les espèces si bankConfig.cashEnabled=false", () => {
    expect(cashPolicy({ cashEnabled: false, cashMaxAmount: 100_000 }).enabled).toBe(false);
  });

  it("applique le plafond le plus bas entre association et plateforme", () => {
    expect(cashPolicy({ cashEnabled: true, cashMaxAmount: 100_000 }, 50_000).max).toBe(50_000);
    expect(cashPolicy({ cashEnabled: true, cashMaxAmount: 10_000 }, 50_000).max).toBe(10_000);
  });

  it("reconnaît les rôles bureau et un JSON invalide sans casser", () => {
    expect(isAssociationBureau("TREASURER")).toBe(true);
    expect(isAssociationBureau("MEMBER")).toBe(false);
    expect(parseBankConfig("{bad json")).toEqual({});
  });
});
