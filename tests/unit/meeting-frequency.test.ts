import { meetingFrequency } from "@/lib/association/meetings";

describe("meetingFrequency", () => {
  it("utilise la fréquence de réunion portée par l'association", () => {
    const frequency = meetingFrequency({
      frequency: "MONTHLY",
      dayOfWeek: 6,
      hour: 15,
      frequencyConfig: {
        mode: "MONTHLY",
        every: 3,
        rule: { kind: "NTH_WEEKDAY", position: 1, weekday: 6 },
      },
    });
    expect(frequency).toMatchObject({
      mode: "MONTHLY",
      every: 3,
      rule: { kind: "NTH_WEEKDAY", position: 1, weekday: 6 },
      startTime: "15:00",
    });
  });

  it("conserve la rétrocompatibilité des anciens meetingConfig", () => {
    const frequency = meetingFrequency({
      frequency: "MONTHLY",
      dayOfWeek: 6,
      hour: 15,
    });
    expect(frequency).toMatchObject({
      mode: "MONTHLY",
      every: 1,
      rule: { kind: "NTH_WEEKDAY", position: 1, weekday: 6 },
    });
  });
});
