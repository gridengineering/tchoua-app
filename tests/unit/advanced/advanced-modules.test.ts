/**
 * Tests Unitaires - Phase 3 : Modules Avancés
 * Couvre : Module 13 (Calendrier Fusionné), Module 07 (Solidarité), Module 17 (Alertes)
 */

// === Types ===
type CalendarEvent = {
  date: Date;
  type: "COTISATION" | "REUNION" | "ROTATION" | "SOLIDARITE" | "ECHEANCE_PRET";
  amount?: number;
  label: string;
  tontineId: string;
};

// === Fonctions de logique calendrier ===

function detectConflicts(events: CalendarEvent[]): CalendarEvent[][] {
  const grouped: Map<string, CalendarEvent[]> = new Map();
  events.forEach((ev) => {
    const key = ev.date.toISOString().split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ev);
  });
  return [...grouped.values()].filter((group) => group.length > 1);
}

function getMonthlyOutflows(events: CalendarEvent[], year: number, month: number): number {
  return events
    .filter((ev) => {
      const d = ev.date;
      return d.getFullYear() === year && d.getMonth() === month && ev.amount !== undefined;
    })
    .reduce((acc, ev) => acc + (ev.amount || 0), 0);
}

// === Fonctions de logique solidarité ===

type SolidarityEvent = {
  type: "NAISSANCE" | "MARIAGE" | "DECES" | "MALADIE";
  memberId: string;
};

function calculateSolidarityAmount(
  event: SolidarityEvent,
  rates: Record<string, number>
): number {
  return rates[event.type] || 0;
}

function canRequestSolidarity(
  memberId: string,
  paidCotisations: number,
  requiredCotisations: number
): { eligible: boolean; reason?: string } {
  if (paidCotisations < requiredCotisations) {
    return {
      eligible: false,
      reason: `Le membre doit avoir payé au moins ${requiredCotisations} cotisations.`,
    };
  }
  return { eligible: true };
}

// === Fonctions de logique alertes ===

function generateReminders(
  events: CalendarEvent[],
  daysBeforeAlert: number
): { event: CalendarEvent; reminderDate: Date }[] {
  const now = new Date();
  return events
    .filter((ev) => {
      const msUntil = ev.date.getTime() - now.getTime();
      const daysUntil = msUntil / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil <= daysBeforeAlert;
    })
    .map((ev) => {
      const reminderDate = new Date(ev.date);
      reminderDate.setDate(reminderDate.getDate() - daysBeforeAlert);
      return { event: ev, reminderDate };
    });
}

// === TESTS ===

describe("Module 18 - Calendrier Fusionné : Détection de conflits", () => {
  const baseDate = new Date("2026-06-15T10:00:00");
  const sameDayEvent1: CalendarEvent = {
    date: new Date("2026-06-15T10:00:00"),
    type: "COTISATION",
    amount: 10000,
    label: "Cotisation Tontine A",
    tontineId: "t1",
  };
  const sameDayEvent2: CalendarEvent = {
    date: new Date("2026-06-15T14:00:00"),
    type: "REUNION",
    label: "Réunion Tontine B",
    tontineId: "t2",
  };
  const otherDayEvent: CalendarEvent = {
    date: new Date("2026-06-20T10:00:00"),
    type: "ROTATION",
    amount: 150000,
    label: "Tirage au sort",
    tontineId: "t1",
  };

  it("détecte un conflit si deux événements sont le même jour", () => {
    const conflicts = detectConflicts([sameDayEvent1, sameDayEvent2, otherDayEvent]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].length).toBe(2);
  });

  it("aucun conflit si chaque événement est un jour différent", () => {
    const conflicts = detectConflicts([sameDayEvent1, otherDayEvent]);
    expect(conflicts.length).toBe(0);
  });

  it("calcule les sorties d'argent mensuelles correctement", () => {
    const events: CalendarEvent[] = [
      { date: new Date("2026-06-05"), type: "COTISATION", amount: 25000, label: "C1", tontineId: "t1" },
      { date: new Date("2026-06-10"), type: "COTISATION", amount: 15000, label: "C2", tontineId: "t2" },
      { date: new Date("2026-07-01"), type: "COTISATION", amount: 30000, label: "C3", tontineId: "t3" },
    ];
    expect(getMonthlyOutflows(events, 2026, 5)).toBe(40000); // juin = mois 5 (0-indexed)
    expect(getMonthlyOutflows(events, 2026, 6)).toBe(30000); // juillet = mois 6
  });
});

describe("Module 07 - Solidarité & Aide Sociale", () => {
  const rates = {
    NAISSANCE: 10000,
    MARIAGE: 25000,
    DECES: 50000,
    MALADIE: 15000,
  };

  it("calcule le montant de l'aide pour un décès", () => {
    const event: SolidarityEvent = { type: "DECES", memberId: "m1" };
    expect(calculateSolidarityAmount(event, rates)).toBe(50000);
  });

  it("calcule le montant de l'aide pour une naissance", () => {
    const event: SolidarityEvent = { type: "NAISSANCE", memberId: "m2" };
    expect(calculateSolidarityAmount(event, rates)).toBe(10000);
  });

  it("retourne 0 pour un type d'événement non configuré", () => {
    const event = { type: "INCONNU" as any, memberId: "m3" };
    expect(calculateSolidarityAmount(event, rates)).toBe(0);
  });

  it("refuse l'éligibilité si cotisations insuffisantes", () => {
    const result = canRequestSolidarity("m4", 2, 6);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("6 cotisations");
  });

  it("confirme l'éligibilité si cotisations suffisantes", () => {
    const result = canRequestSolidarity("m5", 8, 6);
    expect(result.eligible).toBe(true);
  });
});

describe("Module 17 - Alertes & Notifications Intelligentes", () => {
  it("génère un rappel pour un événement dans les N prochains jours", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const events: CalendarEvent[] = [
      { date: tomorrow, type: "COTISATION", amount: 5000, label: "Cotisation dans 2 jours", tontineId: "t1" },
    ];
    const reminders = generateReminders(events, 3);
    expect(reminders.length).toBe(1);
  });

  it("n'émet pas d'alerte pour un événement trop lointain", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    const events: CalendarEvent[] = [
      { date: farFuture, type: "REUNION", label: "Réunion dans 30 jours", tontineId: "t1" },
    ];
    const reminders = generateReminders(events, 3);
    expect(reminders.length).toBe(0);
  });
});
