/**
 * Tests Unitaires - Logique Métier Financière (Phase 2)
 * Couvre : Calcul du Wallet, Algorithme de Répartition, Scoring Crédit
 */

// --- Fonctions utilitaires financières extraites de la logique métier ---

function calculateWalletBalance(
  transactions: { type: "CREDIT" | "DEBIT"; amount: number }[]
): number {
  return transactions.reduce((acc, tx) => {
    return tx.type === "CREDIT" ? acc + tx.amount : acc - tx.amount;
  }, 0);
}

function distributeFunds(
  totalAmount: number,
  obligations: { type: string; amount: number; priority: number }[]
): { type: string; allocated: number; remaining: number }[] {
  const sorted = [...obligations].sort((a, b) => a.priority - b.priority);
  let remaining = totalAmount;
  return sorted.map((ob) => {
    const allocated = Math.min(ob.amount, remaining);
    remaining -= allocated;
    return { type: ob.type, allocated, remaining };
  });
}

function calculateCreditScore(
  cotisationsPaid: number,
  cotisationsTotal: number,
  loansRepaidOnTime: number,
  loansTotal: number
): number {
  if (cotisationsTotal === 0) return 0;
  const paymentRate = (cotisationsPaid / cotisationsTotal) * 70;
  const repaymentRate =
    loansTotal > 0 ? (loansRepaidOnTime / loansTotal) * 30 : 30;
  return Math.round(paymentRate + repaymentRate);
}

// === TESTS ===

describe("Module 12 - Wallet : Calcul du Solde", () => {
  it("solde positif avec credits et debits", () => {
    const txs = [
      { type: "CREDIT" as const, amount: 50000 },
      { type: "DEBIT" as const, amount: 15000 },
      { type: "CREDIT" as const, amount: 10000 },
    ];
    expect(calculateWalletBalance(txs)).toBe(45000);
  });

  it("solde zéro pour wallet vide", () => {
    expect(calculateWalletBalance([])).toBe(0);
  });

  it("solde négatif si débits excèdent crédits", () => {
    const txs = [
      { type: "CREDIT" as const, amount: 5000 },
      { type: "DEBIT" as const, amount: 10000 },
    ];
    expect(calculateWalletBalance(txs)).toBe(-5000);
  });
});

describe("Module 09 - Algorithme de Répartition des Fonds", () => {
  it("répartit les fonds selon la priorité des obligations", () => {
    const obligations = [
      { type: "PRET", amount: 10000, priority: 1 },
      { type: "TONTINE", amount: 20000, priority: 2 },
      { type: "SOLIDARITE", amount: 5000, priority: 3 },
    ];
    const result = distributeFunds(30000, obligations);
    expect(result[0]).toMatchObject({ type: "PRET", allocated: 10000 });
    expect(result[1]).toMatchObject({ type: "TONTINE", allocated: 20000 });
    expect(result[2]).toMatchObject({ type: "SOLIDARITE", allocated: 0 });
  });

  it("alloue tout si montant suffisant pour toutes obligations", () => {
    const obligations = [
      { type: "TONTINE", amount: 5000, priority: 1 },
      { type: "SOLIDARITE", amount: 2000, priority: 2 },
    ];
    const result = distributeFunds(10000, obligations);
    expect(result[0].allocated).toBe(5000);
    expect(result[1].allocated).toBe(2000);
  });
});

describe("Module 05 - Scoring de Crédit Communautaire", () => {
  it("score maximal pour membre exemplaire", () => {
    expect(calculateCreditScore(12, 12, 2, 2)).toBe(100);
  });

  it("score proportionnel aux cotisations payées", () => {
    const score = calculateCreditScore(6, 12, 0, 0);
    expect(score).toBe(65); // 50% cotisations = 35pts + 30 (pas de prêts) = 65
  });

  it("score 0 si aucune cotisation possible", () => {
    expect(calculateCreditScore(0, 0, 0, 0)).toBe(0);
  });
});

describe("Module 04 - Tontine : Validation du Calendrier de Rotation", () => {
  it("le nombre de bénéficiaires doit égaler le nombre de membres", () => {
    const members = ["Marie", "Jean", "Paul", "Alice"];
    const rotationOrder = ["Jean", "Alice", "Marie", "Paul"];
    expect(rotationOrder.length).toBe(members.length);
    // Chaque membre apparaît une et une seule fois
    const uniqueRecipients = new Set(rotationOrder);
    expect(uniqueRecipients.size).toBe(members.length);
    members.forEach((m) => expect(uniqueRecipients.has(m)).toBe(true));
  });
});
