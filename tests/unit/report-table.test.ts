import { buildTablePdf } from "@/lib/association/pdf-table";

describe("PDF table report", () => {
  it("produit un PDF valide avec en-tête et colonnes", () => {
    const pdf = buildTablePdf({
      title: "Rapport de l'association en l'état — Test",
      subtitle: "Situation consolidée",
      meta: ["Situation au 17/11/2026", "3 membres actifs"],
      columns: [
        { key: "rubrique", label: "Rubrique", width: 20 },
        { key: "indicateur", label: "Indicateur", width: 40 },
        { key: "valeur", label: "Valeur", width: 20, align: "right" },
      ],
      rows: [
        { rubrique: "TRÉSORERIE", indicateur: "Caisse", valeur: 500000 },
        { rubrique: "MEMBRES", indicateur: "Actifs", valeur: 3 },
      ],
    });
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("Rapport de l'association");
    expect(text).toContain("Rubrique");
    expect(text).toContain("Caisse");
    expect(text).toContain("500 000");
    expect(text).toContain("%%EOF");
  });

  it("pagine les longues listes", () => {
    const rows = Array.from({ length: 90 }, (_, i) => ({
      date: `2026-11-${String((i % 28) + 1).padStart(2, "0")}`,
      label: `Mouvement ${i + 1}`,
      amount: (i + 1) * 1000,
    }));
    const pdf = buildTablePdf({
      title: "Historique",
      columns: [
        { key: "date", label: "Date", width: 18 },
        { key: "label", label: "Libellé", width: 50 },
        { key: "amount", label: "Montant", width: 20, align: "right" },
      ],
      rows,
    });
    const text = pdf.toString("latin1");
    expect(text).toContain("/Count 4");
    expect(text).toContain("Page 1/4");
    expect(text).toContain("Page 4/4");
  });
});
