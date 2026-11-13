"use client";

import { AlertTriangle, Boxes, GitBranch, Layers, ShieldAlert } from "lucide-react";
import {
  ARP_CONDITIONS,
  ARP_DIMENSIONS,
  conditionsFor,
  qualificationFor,
} from "@/lib/arp/catalogue";
import { fromMinor, toMinor } from "@/lib/arp/money";
import type { ArpConfig, ArpModuleKey } from "@/lib/arp/types";
import {
  CheckLine,
  EmptyHint,
  NumberField,
  SectionCard,
  SelectField,
  StatusPill,
  TextField,
  Toggle,
} from "./arp-ui";

const MODULE_LABELS: Array<[ArpModuleKey, string, string]> = [
  ["tontine", "Tontine", "Souscriptions, droits, attributions et clôtures."],
  ["savings", "Épargne", "Dépôts, retraits, blocages et rémunération."],
  ["credit", "Crédit", "Demandes, plafonds, échéanciers et recouvrement."],
  ["socialAid", "Aides sociales", "Catalogue, événements, plafonds et recours."],
  ["nature", "Nature", "Contributions en nature, stocks et valorisation."],
  ["meetings", "Réunions", "Calendrier, présences, procès-verbaux et actions."],
  ["projects", "Projets", "Objectifs, budgets, jalons et rapports bailleurs."],
  ["stocks", "Achats et stocks", "Commandes groupées, réceptions et inventaires."],
  ["events", "Événements", "Collation, capacité, invitations et logistique."],
  ["community", "Communauté", "Annuaire, messages, formation et distinctions."],
  ["investment", "Investissement", "Capital, revenus, pertes et dividendes."],
  ["collation", "Collation", "Contribution par séance et forfait hôte."],
];

function getPath(config: ArpConfig, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, config);
}

function filled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value > 0;
  if (typeof value === "boolean") return value;
  return value !== null && value !== undefined;
}

export function ArpModulesPanel({
  config,
  canEdit,
  update,
}: {
  config: ArpConfig;
  canEdit: boolean;
  update: (path: string, value: unknown) => void;
}) {
  const conditions = conditionsFor(config.dimensions);
  const qualification = qualificationFor(conditions);
  const currency = config.identity.currency;
  const minor = (value: number) => {
    try {
      return fromMinor(BigInt(Math.round(value)), currency);
    } catch {
      return 0;
    }
  };
  const setMinor = (path: string, value: number) => {
    try {
      update(path, Number(toMinor(value, currency)));
    } catch {
      update(path, 0);
    }
  };

  const conditionFields: Record<string, string[]> = {
    C01: ["prerequisites.natureValuation", "prerequisites.natureSaleLiquidity"],
    C02: ["prerequisites.auctionBasis", "prerequisites.auctionCloseRule", "prerequisites.offlineOfferPolicy"],
    C03: ["prerequisites.paymentProvider", "prerequisites.offlinePaymentPolicy", "prerequisites.externalConfirmation"],
    C04: ["prerequisites.exchangeRateSource", "prerequisites.exchangeRateDate", "prerequisites.exchangeMarginPct", "prerequisites.presentationCurrency"],
    C05: ["membership.familyCapUnit", "membership.householdDefinition"],
    C06: ["prerequisites.creditThresholdMinor", "prerequisites.creditConflictRule"],
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Combinaison de référence"
        description="Dix dimensions bornées. Le catalogue de 23 328 configurations est calculé côté serveur et vérifié par recette."
        icon={<Layers className="h-4 w-4" />}
        actions={
          conditions.length > 0 ? (
            <StatusPill tone="amber">{conditions.length} condition(s)</StatusPill>
          ) : (
            <StatusPill tone="green">Sans condition</StatusPill>
          )
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ARP_DIMENSIONS.map((dimension) => {
            const current = config.dimensions[dimension.key];
            const def = dimension.values.find((v) => v.value === current);
            return (
              <div key={dimension.key} className="rounded-xl border border-[#eee8dc] bg-white p-3">
                <SelectField
                  label={dimension.label}
                  value={current}
                  onChange={(value) => update(`dimensions.${dimension.key}`, value)}
                  options={dimension.values.map((value) => ({ value: value.value, label: value.label }))}
                  disabled={!canEdit}
                />
                <p className="mt-1.5 text-[11px] leading-4 text-[#8a8378]">{def?.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] px-3.5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Qualification
          </span>
          <StatusPill tone={conditions.length === 0 ? "green" : "amber"}>{qualification}</StatusPill>
          {conditions.map((code) => (
            <span
              key={code}
              className="inline-flex items-center rounded-md border border-[#e4dfd5] bg-white px-2 py-0.5 font-mono text-[10.5px] text-[#57534e]"
            >
              {code} · {ARP_CONDITIONS[code].label}
            </span>
          ))}
        </div>

        {conditions.length > 0 ? (
          <div className="mt-3 space-y-2">
            {conditions.map((code) => {
              const def = ARP_CONDITIONS[code];
              const missing = conditionFields[code].filter((path) => !filled(getPath(config, path)));
              return (
                <div
                  key={code}
                  className={`rounded-xl border p-3 ${
                    missing.length ? "border-[#f2dfb8] bg-[#fffbf1]" : "border-[#cce8d4] bg-[#f7fcf8]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#57534e]">{code}</span>
                    <span className="text-xs font-semibold text-[#3f3a33]">{def.label}</span>
                    {missing.length ? (
                      <StatusPill tone="amber">{missing.length} champ(s) à compléter</StatusPill>
                    ) : (
                      <StatusPill tone="green">Prêt</StatusPill>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-4 text-[#7a7368]">{def.message}</p>
                  <p className="mt-1 text-[10.5px] text-[#a8a093]">Porte de sortie : {def.minVersion}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyHint>
              Cette combinaison n&apos;ajoute aucune condition supplémentaire. Les invariants
              universels (isolation, unicité, audit, équilibre) restent actifs.
            </EmptyHint>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Paramètres requis par les conditions"
        description="Chaque condition du catalogue ouvre des champs obligatoires. Les valeurs restent locales à l'association."
        icon={<GitBranch className="h-4 w-4" />}
      >
        <div className="space-y-5">
          {conditions.includes("C01") ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">C01 · Liquidité de la nature</p>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="Méthode de valorisation"
                  value={config.prerequisites.natureValuation}
                  onChange={(v) => update("prerequisites.natureValuation", v)}
                  placeholder="Prix de marché constaté, barème approuvé, expertise…"
                  disabled={!canEdit}
                />
                <TextField
                  label="Règle de liquidité"
                  value={config.prerequisites.natureSaleLiquidity}
                  onChange={(v) => update("prerequisites.natureSaleLiquidity", v)}
                  placeholder="Vente préalable obligatoire, financement autorisé…"
                  disabled={!canEdit}
                />
              </div>
            </div>
          ) : null}

          {config.dimensions.tontine === "encheres" ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">Enchères · assiette et clôture</p>
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Assiette de la décote"
                  value={config.prerequisites.auctionBasis}
                  onChange={(v) => update("prerequisites.auctionBasis", v)}
                  options={[
                    { value: "", label: "— Choisir —" },
                    { value: "POT", label: "Pot disponible" },
                    { value: "DROIT_BRUT", label: "Droit brut du bénéficiaire" },
                    { value: "COTISATION", label: "Cotisation périodique" },
                    { value: "FORFAIT", label: "Montant fixe" },
                  ]}
                  disabled={!canEdit}
                  hint="Un pourcentage sans assiette est refusé."
                />
                <NumberField
                  label="Mise à prix"
                  value={config.prerequisites.auctionMinBidPct}
                  onChange={(v) => update("prerequisites.auctionMinBidPct", v)}
                  min={0.01}
                  max={100}
                  step={0.5}
                  suffix="%"
                  disabled={!canEdit}
                  hint="SI 5 % sur 25 000 (cotisation) → 1 250 ; sur 600 000 (droit) → 30 000."
                />
                <TextField
                  label="Règle de clôture et d'égalité"
                  value={config.prerequisites.auctionCloseRule}
                  onChange={(v) => update("prerequisites.auctionCloseRule", v)}
                  placeholder="Heure serveur, première offre valide, prolongation de 2 min…"
                  disabled={!canEdit}
                  className="md:col-span-2"
                />
                {config.dimensions.connexion === "hors_ligne" ? (
                  <TextField
                    label="Politique d'offre hors ligne"
                    value={config.prerequisites.offlineOfferPolicy}
                    onChange={(v) => update("prerequisites.offlineOfferPolicy", v)}
                    placeholder="Brouillon local, offre définitive seulement après horodatage serveur…"
                    disabled={!canEdit}
                    className="md:col-span-2"
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {conditions.includes("C03") ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">C03 · Confirmation externe</p>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="Prestataire de paiement"
                  value={config.prerequisites.paymentProvider}
                  onChange={(v) => update("prerequisites.paymentProvider", v)}
                  placeholder="MTN MoMo, Orange Money, agrégateur…"
                  disabled={!canEdit}
                />
                <TextField
                  label="Politique de paiement hors ligne"
                  value={config.prerequisites.offlinePaymentPolicy}
                  onChange={(v) => update("prerequisites.offlinePaymentPolicy", v)}
                  placeholder="Intention seulement, confirmation après webhook signé…"
                  disabled={!canEdit}
                />
              </div>
              <div className="mt-3">
                <Toggle
                  label="Confirmation externe obligatoire"
                  description="Aucun solde n'est rendu disponible sans preuve serveur du prestataire."
                  checked={config.prerequisites.externalConfirmation}
                  onChange={(v) => update("prerequisites.externalConfirmation", v)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          ) : null}

          {conditions.includes("C04") ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">C04 · Politique de change</p>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="Source du cours"
                  value={config.prerequisites.exchangeRateSource}
                  onChange={(v) => update("prerequisites.exchangeRateSource", v)}
                  placeholder="Banque centrale, prestataire, cours saisi contrôlé…"
                  disabled={!canEdit}
                />
                <TextField
                  label="Date de référence"
                  type="date"
                  value={config.prerequisites.exchangeRateDate}
                  onChange={(v) => update("prerequisites.exchangeRateDate", v)}
                  disabled={!canEdit}
                />
                <NumberField
                  label="Marge de change"
                  value={config.prerequisites.exchangeMarginPct}
                  onChange={(v) => update("prerequisites.exchangeMarginPct", v)}
                  min={0}
                  step={0.1}
                  suffix="%"
                  disabled={!canEdit}
                />
                <TextField
                  label="Devise de présentation"
                  value={config.prerequisites.presentationCurrency}
                  onChange={(v) => update("prerequisites.presentationCurrency", v.toUpperCase().slice(0, 3))}
                  placeholder="EUR"
                  disabled={!canEdit}
                />
              </div>
              <div className="mt-3">
                <EmptyHint>
                  Le taux accepté sur une opération reste figé. XAF et XOF restent deux codes
                  distincts : aucune fusion implicite de comptes.
                </EmptyHint>
              </div>
            </div>
          ) : null}

          {conditions.includes("C05") ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">C05 · Plafond familial</p>
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Unité de plafond"
                  value={config.membership.familyCapUnit}
                  onChange={(v) => update("membership.familyCapUnit", v)}
                  options={[
                    { value: "MEMBRE", label: "Par membre" },
                    { value: "MENAGE", label: "Par ménage" },
                    { value: "AYANT_DROIT", label: "Par ayant droit" },
                  ]}
                  disabled={!canEdit}
                />
                <TextField
                  label="Définition du ménage"
                  value={config.membership.householdDefinition}
                  onChange={(v) => update("membership.householdDefinition", v)}
                  placeholder="Conjoint déclaré, enfants à charge, résidence…"
                  disabled={!canEdit}
                />
              </div>
            </div>
          ) : null}

          {conditions.includes("C06") ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">C06 · Seuil et déport du crédit</p>
              <div className="grid gap-3 md:grid-cols-3">
                <NumberField
                  label="Seuil de décision"
                  value={minor(config.prerequisites.creditThresholdMinor)}
                  onChange={(v) => setMinor("prerequisites.creditThresholdMinor", v)}
                  step={currency === "XAF" || currency === "XOF" ? 5000 : 10}
                  suffix={currency}
                  disabled={!canEdit}
                />
                <NumberField
                  label="Ratio maximum d'endettement"
                  value={config.prerequisites.creditMaxRatioPct}
                  onChange={(v) => update("prerequisites.creditMaxRatioPct", v)}
                  min={0}
                  max={100}
                  suffix="%"
                  disabled={!canEdit}
                />
                <TextField
                  label="Règle de déport"
                  value={config.prerequisites.creditConflictRule}
                  onChange={(v) => update("prerequisites.creditConflictRule", v)}
                  placeholder="Le demandeur et les parties liées ne votent pas…"
                  disabled={!canEdit}
                />
              </div>
            </div>
          ) : null}

          {config.dimensions.aide === "jours" ? (
            <div className="rounded-xl border border-[#eee8dc] p-3.5">
              <p className="mb-2 text-xs font-bold text-[#3f3a33]">Aide indemnitaire par jour</p>
              <div className="grid gap-3 md:grid-cols-2">
                <NumberField
                  label="Plafond journalier"
                  value={minor(config.prerequisites.aideDailyCapMinor)}
                  onChange={(v) => setMinor("prerequisites.aideDailyCapMinor", v)}
                  step={currency === "XAF" || currency === "XOF" ? 500 : 1}
                  suffix={currency}
                  disabled={!canEdit}
                  hint="Le minimum d'hospitalisation et les jours indemnisables sont deux paramètres distincts (SOL03)."
                />
                <NumberField
                  label="Plafond annuel"
                  value={minor(config.prerequisites.aideAnnualCapMinor)}
                  onChange={(v) => setMinor("prerequisites.aideAnnualCapMinor", v)}
                  step={currency === "XAF" || currency === "XOF" ? 5000 : 10}
                  suffix={currency}
                  disabled={!canEdit}
                />
              </div>
            </div>
          ) : null}

          {!conditions.includes("C01") &&
          !conditions.includes("C03") &&
          !conditions.includes("C04") &&
          !conditions.includes("C05") &&
          !conditions.includes("C06") &&
          config.dimensions.tontine !== "encheres" &&
          config.dimensions.aide !== "jours" ? (
            <EmptyHint>
              Aucun paramètre conditionnel n&apos;est requis pour cette combinaison. Les
              paramètres financiers restent disponibles dans l&apos;onglet Profil.
            </EmptyHint>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Modules et capacités"
        description="Une dimension ouverte exige son module. Une désactivation préserve les consultations et liquidations."
        icon={<Boxes className="h-4 w-4" />}
      >
        <div className="grid gap-2.5 md:grid-cols-2">
          {MODULE_LABELS.map(([key, label, description]) => (
            <Toggle
              key={key}
              label={label}
              description={description}
              checked={config.modules[key]}
              onChange={(value) => update(`modules.${key}`, value)}
              disabled={!canEdit}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Garde-fous de la combinaison"
        description="Les contrôles ci-dessous restent actifs quelle que soit la configuration locale."
        icon={<ShieldAlert className="h-4 w-4" />}
      >
        <div className="space-y-2">
          <CheckLine ok>Isolation : toute requête vérifie l&apos;appartenance à l&apos;association (SEC01).</CheckLine>
          <CheckLine ok>Unicité : une référence prestataire ne peut être comptabilisée deux fois (PAY01).</CheckLine>
          <CheckLine ok>Concurrence : une seule validation consomme un droit ou un fonds (ATT02).</CheckLine>
          <CheckLine ok>Audit : les actions et lectures sensibles sont journalisées (SEC04).</CheckLine>
          <CheckLine ok>Versions : une version publiée est immuable et rejouable (REG01).</CheckLine>
          {config.dimensions.tontine === "encheres" ? (
            <CheckLine ok={Boolean(config.prerequisites.auctionBasis)}>
              Enchères : assiette nommée avant réception des offres (ENC01).
            </CheckLine>
          ) : null}
          {config.dimensions.validation === "double" ? (
            <CheckLine ok={config.governance.separationOfDuties}>
              Double validation : le créateur ne peut pas approuver seul (PRE03).
            </CheckLine>
          ) : null}
        </div>
        {config.dimensions.tontine === "encheres" && !config.prerequisites.auctionBasis ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#f3cdcd] bg-[#fef6f6] px-3 py-2 text-[11.5px] text-[#991b1b]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Sans assiette, la mise à prix ne peut pas être calculée : la publication reste bloquée.
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
