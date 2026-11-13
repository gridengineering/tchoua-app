"use client";

import { Building2, Coins, Landmark, ShieldCheck, Users } from "lucide-react";
import { fromMinor, toMinor } from "@/lib/arp/money";
import type { ArpConfig } from "@/lib/arp/types";
import {
  CheckLine,
  EmptyHint,
  Field,
  NumberField,
  SectionCard,
  SelectField,
  TextField,
  Toggle,
} from "./arp-ui";

const PURPOSES = [
  ["ENTRAIDE", "Entraide"],
  ["EPARGNE", "Épargne"],
  ["INVESTISSEMENT", "Investissement"],
  ["CULTURE", "Culture"],
  ["SPORT", "Sport"],
  ["DEVELOPPEMENT", "Développement"],
  ["PROFESSIONNEL", "Réseau professionnel"],
  ["RELIGIEUX", "Religieux"],
  ["DIASPORA", "Diaspora"],
  ["EDUCATION", "Éducation"],
  ["SANTE", "Santé"],
] as const;

const START_MODELS = [
  ["BLANK", "Vierge"],
  ["QUARTIER", "Tontine de quartier"],
  ["AMICALE", "Amicale familiale"],
  ["FEV", "Fédération (type FEV)"],
  ["SLD", "Section (type SLD)"],
  ["HORIZON", "Investissement (type HORIZON)"],
  ["AGRICOLE", "Groupement agricole"],
  ["CULTUREL", "Club culturel ou sportif"],
  ["PROJET", "Association de développement"],
  ["PROFESSIONNEL", "Réseau professionnel"],
  ["DIASPORA", "Diaspora multi-pays"],
  ["COOPERATIVE", "Coopérative"],
  ["MUTUELLE", "Mutuelle"],
].map(([value, label]) => ({ value, label }));

export function ArpProfilePanel({
  config,
  canEdit,
  update,
}: {
  config: ArpConfig;
  canEdit: boolean;
  update: (path: string, value: unknown) => void;
}) {
  const currency = config.identity.currency;

  const minorValue = (minor: number) => {
    try {
      return fromMinor(BigInt(Math.round(minor)), currency);
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

  const togglePurpose = (purpose: string) => {
    const next = config.identity.purposes.includes(purpose)
      ? config.identity.purposes.filter((p) => p !== purpose)
      : [...config.identity.purposes, purpose];
    update("identity.purposes", next);
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Identité et forme d'organisation"
        description="Un identifiant stable survit au changement de dénomination. Le modèle logiciel ne vaut ni statut déposé ni autorisation réglementée (ORG04)."
        icon={<Building2 className="h-4 w-4" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Forme fonctionnelle"
            value={config.dimensions.organisation}
            onChange={(v) => update("dimensions.organisation", v)}
            options={[
              { value: "autonome", label: "Association autonome" },
              { value: "section", label: "Section interne" },
              { value: "federation", label: "Fédération" },
            ]}
            disabled={!canEdit}
            hint="Le rattachement administratif ne vaut pas propriété comptable."
          />
          <SelectField
            label="Modèle de départ"
            value={config.identity.startModel}
            onChange={(v) => update("identity.startModel", v)}
            options={START_MODELS}
            disabled={!canEdit}
            hint="Copier une version identifiée ; les mises à jour ne sont pas imposées."
          />
          <TextField
            label="Statut juridique déclaré"
            value={config.identity.legalStatus}
            onChange={(v) => update("identity.legalStatus", v)}
            placeholder="Association déclarée, non déclarée, en cours…"
            disabled={!canEdit}
            hint="Distinguer déclaré, vérifié et non renseigné."
          />
          <TextField
            label="Référence de la preuve"
            value={config.identity.legalStatusProof}
            onChange={(v) => update("identity.legalStatusProof", v)}
            placeholder="Récépissé, statuts, décision…"
            disabled={!canEdit}
          />
          <TextField
            label="Pays de l'entité"
            value={config.identity.country}
            onChange={(v) => update("identity.country", v.toUpperCase().slice(0, 2))}
            placeholder="CM"
            disabled={!canEdit}
            hint="Code ISO à deux lettres. Le territoire peut différer du siège."
          />
          <TextField
            label="Devise fonctionnelle"
            value={currency}
            onChange={(v) => update("identity.currency", v.toUpperCase().slice(0, 3))}
            placeholder="XAF"
            disabled={!canEdit}
            hint="Verrouillée après la première écriture ; tout changement exige une procédure dédiée."
          />
          <TextField
            label="Fuseau horaire"
            value={config.identity.timezone}
            onChange={(v) => update("identity.timezone", v)}
            placeholder="Africa/Douala"
            disabled={!canEdit}
            hint="Les instants sont stockés en UTC (REU01)."
          />
          <TextField
            label="Date de création"
            type="date"
            value={config.identity.creationDate ?? ""}
            onChange={(v) => update("identity.creationDate", v || null)}
            disabled={!canEdit}
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
            Finalités (plusieurs possibles, budgets distincts)
          </p>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map(([value, label]) => {
              const active = config.identity.purposes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => togglePurpose(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-[#0d3d28] bg-[#0d3d28] text-white"
                      : "border-[#ddd6c8] bg-white text-[#4b5563] hover:border-[#0d3d28]/50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {config.dimensions.organisation === "section" ? (
          <div className="mt-4">
            <EmptyHint>
              Cette association est une section interne. Le rattachement à la mère est
              contrôlé par la hiérarchie de l&apos;association ; une section applique le socle
              national et ne surcharge que les paramètres autorisés (FED02).
            </EmptyHint>
            <div className="mt-3">
              <SelectField
                label="Mode d'héritage"
                value={config.prerequisites.inheritanceMode}
                onChange={(v) => update("prerequisites.inheritanceMode", v)}
                options={[
                  { value: "NONE", label: "Aucun (section autonome)" },
                  { value: "MANDATORY", label: "Obligatoire (socle verrouillé)" },
                  { value: "DEFAULT", label: "Valeur par défaut (surcharge possible)" },
                  { value: "FREE", label: "Libre (surcharge autorisée)" },
                ]}
                disabled={!canEdit}
              />
            </div>
          </div>
        ) : null}

        {config.dimensions.organisation === "federation" ? (
          <div className="mt-4">
            <TextField
              label="Règle de délégués"
              value={config.prerequisites.delegateRule}
              onChange={(v) => update("prerequisites.delegateRule", v)}
              placeholder="10 % des membres, plafond 11 délégués, arrondi supérieur"
              disabled={!canEdit}
              hint="Préciser le taux, l'arrondi, la date de référence et les membres admissibles."
            />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Gouvernance, mandats et décisions"
        description="Le quorum et la majorité doivent être reproductibles. La majorité des exprimés n'est pas celle des inscrits (GOV01–GOV04)."
        icon={<ShieldCheck className="h-4 w-4" />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField
            label="Quorum"
            value={config.governance.quorumPct}
            onChange={(v) => update("governance.quorumPct", v)}
            min={1}
            max={100}
            suffix="%"
            disabled={!canEdit}
            hint="Arrondi du minimum requis au supérieur."
          />
          <SelectField
            label="Règle de majorité"
            value={config.governance.majority}
            onChange={(v) => update("governance.majority", v)}
            options={[
              { value: "RELATIVE", label: "Relative aux exprimés" },
              { value: "ABSOLUE", label: "Absolue des inscrits" },
              { value: "QUALIFIEE", label: "Qualifiée (deux tiers)" },
              { value: "UNANIMITE", label: "Unanimité" },
            ]}
            disabled={!canEdit}
          />
          <NumberField
            label="Délai de convocation"
            value={config.governance.convocationDays}
            onChange={(v) => update("governance.convocationDays", v)}
            min={1}
            suffix="jours"
            disabled={!canEdit}
            hint="Le statut spécifique validé prime sur le délai générique."
          />
          <NumberField
            label="Durée d'un mandat"
            value={config.governance.mandateYears}
            onChange={(v) => update("governance.mandateYears", v)}
            min={0}
            suffix="ans"
            disabled={!canEdit}
          />
          <NumberField
            label="Renouvellements max."
            value={config.governance.maxRenewals}
            onChange={(v) => update("governance.maxRenewals", v)}
            min={0}
            disabled={!canEdit}
          />
          <NumberField
            label="Procurations par mandataire"
            value={config.governance.proxyMax}
            onChange={(v) => update("governance.proxyMax", v)}
            min={0}
            disabled={!canEdit}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            label="Séparation des fonctions"
            description="Création, approbation et paiement confiés à des personnes distinctes."
            checked={config.governance.separationOfDuties}
            onChange={(v) => update("governance.separationOfDuties", v)}
            disabled={!canEdit}
          />
          <Toggle
            label="Responsables du bureau déclarés"
            description="Condition d'activation ORG02 ; vérifiée aussi depuis la fiche de l'association."
            checked={config.governance.officersDeclared}
            onChange={(v) => update("governance.officersDeclared", v)}
            disabled={!canEdit}
          />
        </div>
        <div className="mt-4">
          <TextField
            label="Référence de la décision de création"
            value={config.governance.creationDecisionRef}
            onChange={(v) => update("governance.creationDecisionRef", v)}
            placeholder="PV d'assemblée, arrêté, décision n°…"
            disabled={!canEdit}
            hint="Obligatoire pour publier la première version active."
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Adhésions, familles et confidentialité"
        description="L'adhésion est un contrat distinct du compte utilisateur. Une radiation ne solde pas une dette (MEM01–MEM04)."
        icon={<Users className="h-4 w-4" />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Voie d'admission"
            value={config.membership.admissionMode}
            onChange={(v) => update("membership.admissionMode", v)}
            options={[
              { value: "OUVERTE", label: "Ouverte" },
              { value: "INVITATION", label: "Sur invitation" },
              { value: "PARRAINAGE", label: "Parrainage" },
              { value: "COMMISSION", label: "Commission d'admission" },
            ]}
            disabled={!canEdit}
          />
          <NumberField
            label="Droit d'entrée"
            value={minorValue(config.membership.admissionFeeMinor)}
            onChange={(v) => setMinor("membership.admissionFeeMinor", v)}
            step={currency === "XAF" || currency === "XOF" ? 500 : 1}
            suffix={currency}
            disabled={!canEdit}
            hint="Un droit acquis n'est pas un dépôt remboursable."
          />
          <NumberField
            label="Âge minimum"
            value={config.membership.ageMin}
            onChange={(v) => update("membership.ageMin", v)}
            min={0}
            suffix="ans"
            disabled={!canEdit}
          />
          <NumberField
            label="Parrains requis"
            value={config.membership.sponsorshipCount}
            onChange={(v) => update("membership.sponsorshipCount", v)}
            min={0}
            disabled={!canEdit}
          />
          <NumberField
            label="Préavis de sortie"
            value={config.membership.exitNoticeDays}
            onChange={(v) => update("membership.exitNoticeDays", v)}
            min={0}
            suffix="jours"
            disabled={!canEdit}
          />
          <SelectField
            label="Unité de plafond familial"
            value={config.membership.familyCapUnit}
            onChange={(v) => update("membership.familyCapUnit", v)}
            options={[
              { value: "MEMBRE", label: "Par membre" },
              { value: "MENAGE", label: "Par ménage" },
              { value: "AYANT_DROIT", label: "Par ayant droit" },
            ]}
            disabled={!canEdit}
            hint="Condition C05 lorsque l'adhésion est familiale et qu'une aide existe."
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            label="Parrainage obligatoire"
            description="Le nombre de parrains et leur ancienneté sont contrôlés."
            checked={config.membership.sponsorshipRequired}
            onChange={(v) => update("membership.sponsorshipRequired", v)}
            disabled={!canEdit}
          />
          <TextField
            label="Définition du ménage / de l'ayant droit"
            value={config.membership.householdDefinition}
            onChange={(v) => update("membership.householdDefinition", v)}
            placeholder="Conjoint, enfants à charge, résidence…"
            disabled={!canEdit}
          />
        </div>
        <div className="mt-3">
          <EmptyHint>
            Les pièces médicales restent masquées au trésorier ; il voit le montant et le
            bénéficiaire, pas le diagnostic (FAM03, SEC03). L&apos;annuaire public exige un
            consentement distinct.
          </EmptyHint>
        </div>
      </SectionCard>

      <SectionCard
        title="Noyau financier et invariants"
        description="Les montants sont conservés en unités entières. Un transfert entre comptes ne crée ni produit ni charge (FIN01–FIN04)."
        icon={<Landmark className="h-4 w-4" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Seuil de double validation"
            value={minorValue(config.finance.doubleValidationThresholdMinor)}
            onChange={(v) => setMinor("finance.doubleValidationThresholdMinor", v)}
            step={currency === "XAF" || currency === "XOF" ? 5000 : 10}
            suffix={currency}
            disabled={!canEdit}
            hint="Au-delà de ce montant, un second approbateur est exigé."
          />
          <NumberField
            label="Validité d'une réservation"
            value={config.finance.reservationExpiryDays}
            onChange={(v) => update("finance.reservationExpiryDays", v)}
            min={1}
            suffix="jours"
            disabled={!canEdit}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            label="Pièce justificative obligatoire"
            description="Selon le type et le montant de la dépense."
            checked={config.finance.requireSupportingDocument}
            onChange={(v) => update("finance.requireSupportingDocument", v)}
            disabled={!canEdit}
          />
          <Toggle
            label="Paiements idempotents"
            description="Une même référence externe ne peut être comptabilisée deux fois (PAY01)."
            checked={config.finance.idempotentPayments}
            onChange={(v) => update("finance.idempotentPayments", v)}
            disabled={!canEdit}
          />
        </div>
        <div className="mt-4 space-y-2 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
            Invariants non désactivables
          </p>
          <CheckLine ok>Journal équilibré : total débit = total crédit, par devise de tenue.</CheckLine>
          <CheckLine ok>Aucun fonds ne peut être dépensé au-delà de son disponible autorisé.</CheckLine>
          <CheckLine ok>Isolation des associations, unicité des paiements, audit et concurrence.</CheckLine>
          <CheckLine ok>Montants, devises et dates valeur sont des types de domaine, jamais des chaînes libres.</CheckLine>
          <CheckLine ok>Les corrections sont des opérations liées ; aucune écriture financière n&apos;est supprimée.</CheckLine>
        </div>
        <div className="mt-3">
          <EmptyHint>
            Une désactivation de module masque les nouvelles souscriptions mais préserve les
            consultations, corrections et liquidations nécessaires aux obligations existantes.
          </EmptyHint>
        </div>
      </SectionCard>

      <SectionCard
        title="Note de cadrage"
        description="Décisions locales, dérogations et points à arbitrer avant publication."
        icon={<Coins className="h-4 w-4" />}
      >
        <Field label="Note interne">
          <textarea
            value={config.notes}
            onChange={(event) => update("notes", event.target.value)}
            disabled={!canEdit}
            rows={4}
            placeholder="Assiette des enchères, traitement du cas de dix ans, cumul des sanctions, écarts de dividendes…"
            className="w-full rounded-lg border border-[#e2ddd4] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-[#0d3d28] focus:ring-2 focus:ring-[#0d3d28]/10 disabled:bg-[#f6f3ec]"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
