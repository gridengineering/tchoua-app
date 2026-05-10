import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getInitials,
  getLevelInfo,
  getStatusColor,
  getPaymentMethodLabel,
  getTontineTypeLabel,
  getFrequencyLabel,
} from "@/lib/utils";

describe("Utils Library", () => {
  describe("formatCurrency", () => {
    it("should format numbers to currency string with FCFA by default", () => {
      expect(formatCurrency(15000)).toBe("15\u202F000 FCFA"); // Node 19+ Intl format uses narrow no-break space
    });
    
    it("should allow custom currency symbol", () => {
      expect(formatCurrency(100, "EUR").replace(/\s/g, " ")).toBe("100 EUR");
    });
  });

  describe("getInitials", () => {
    it("should return the first two initials capitalized", () => {
      expect(getInitials("Jean Dupont")).toBe("JD");
      expect(getInitials("marie claire")).toBe("MC");
    });

    it("should handle single words", () => {
      expect(getInitials("Admin")).toBe("A");
    });
  });

  describe("getLevelInfo", () => {
    it("should return correct level info for a valid level", () => {
      expect(getLevelInfo("LEADER")).toEqual({ label: "Leader", color: "text-cyan-400", icon: "🦁", minScore: 600 });
    });

    it("should fallback to NOVICE if level is unknown", () => {
      expect(getLevelInfo("UNKNOWN")).toEqual({ label: "Novice", color: "text-amber-600", icon: "🌱", minScore: 0 });
    });
  });

  describe("getStatusColor", () => {
    it("should return correct color classes for ACTIVE", () => {
      expect(getStatusColor("ACTIVE")).toBe("bg-green-100 text-green-800");
    });

    it("should return fallback classes for unknown status", () => {
      expect(getStatusColor("UNKNOWN")).toBe("bg-gray-100 text-gray-800");
    });
  });

  describe("getPaymentMethodLabel", () => {
    it("should return translated label for known methods", () => {
      expect(getPaymentMethodLabel("MTN_MOMO")).toBe("MTN MoMo");
    });

    it("should return the key if method is unknown", () => {
      expect(getPaymentMethodLabel("UNKNOWN_METHOD")).toBe("UNKNOWN_METHOD");
    });
  });
});
