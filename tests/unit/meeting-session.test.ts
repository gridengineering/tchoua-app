import { agendaTemplate, meetingFrequency, suggestNextSession } from "@/lib/association/meetings";

describe("sessions de réunion", () => {
  it("propose le dernier dimanche mensuel à l'heure configurée", () => {
    const date = suggestNextSession(
      { frequency: "MONTHLY", dayOfWeek: 0, hour: 15, sessionRule: { kind: "NTH_WEEKDAY", position: 5, weekday: 0 } },
      new Date("2026-11-17T09:00:00.000Z")
    );
    expect(date?.toISOString().slice(0, 10)).toBe("2026-11-29");
    expect(date?.getHours()).toBe(15);
  });

  it("ne propose rien quand les sessions sont désactivées", () => {
    expect(meetingFrequency({ sessionsEnabled: false })).toBeNull();
    expect(suggestNextSession({ sessionsEnabled: false })).toBeNull();
  });

  it("fournit le modèle d'ordre du jour par défaut", () => {
    expect(agendaTemplate({})).toContain("Appel et vérification du quorum");
    expect(agendaTemplate({ agendaTemplate: [] })).toEqual([]);
  });
});
