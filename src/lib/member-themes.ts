export type MemberThemeId = "forest" | "midnight" | "aurora" | "ocean" | "sable" | "neon";

export type MemberTheme = {
  id: MemberThemeId;
  name: string;
  tagline: string;
  dark: boolean;
  swatches: [string, string, string];
};

export const MEMBER_THEMES: MemberTheme[] = [
  { id: "forest", name: "Forêt", tagline: "Nature & confiance", dark: false, swatches: ["#0d3d28", "#d4a343", "#f8fafc"] },
  { id: "midnight", name: "Minuit", tagline: "Sombre & focalisé", dark: true, swatches: ["#0f172a", "#38bdf8", "#8b5cf6"] },
  { id: "aurora", name: "Aurore", tagline: "Violet créatif", dark: false, swatches: ["#7c3aed", "#ec4899", "#faf7ff"] },
  { id: "ocean", name: "Océan", tagline: "Bleu analytique", dark: false, swatches: ["#0369a1", "#06b6d4", "#f2f9fd"] },
  { id: "sable", name: "Sable", tagline: "Chaleur terre", dark: false, swatches: ["#b45309", "#d97706", "#fdf8f0"] },
  { id: "neon", name: "Néon", tagline: "Cyber & contraste", dark: true, swatches: ["#a3e635", "#f0abfc", "#07070c"] },
];

export const DEFAULT_MEMBER_THEME: MemberThemeId = "forest";

export function isMemberTheme(value: unknown): value is MemberThemeId {
  return typeof value === "string" && MEMBER_THEMES.some((t) => t.id === value);
}
