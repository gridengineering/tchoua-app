export type TrustCriterion = {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
};

export type TrustBreakdown = {
  score: number;
  level: number;
  label: string;
  criteria: TrustCriterion[];
  computedAt: string;
};

export const TRUST_LEVELS = [
  { level: 0, label: "Non évaluée", min: 0, color: "slate" },
  { level: 1, label: "Découverte", min: 20, color: "sky" },
  { level: 2, label: "Bronze", min: 40, color: "amber" },
  { level: 3, label: "Argent", min: 60, color: "zinc" },
  { level: 4, label: "Or", min: 80, color: "yellow" },
  { level: 5, label: "Platine", min: 95, color: "violet" },
];

export function trustLevelForScore(score: number) {
  return [...TRUST_LEVELS].reverse().find((level) => score >= level.min) ?? TRUST_LEVELS[0];
}
