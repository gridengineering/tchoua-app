"use client";

import { useMemo, useState } from "react";
import { Calculator, Coins, HandCoins } from "lucide-react";
import {
  buildAmortizationSchedule,
  computeAttribution,
  projectContributions,
  type AmortizationMethod,
} from "@/lib/arp/finance";
import { formatMoney, fromMinor, toMinor } from "@/lib/arp/money";
import type { ArpConfig } from "@/lib/arp/types";
import { NumberField, SectionCard, SelectField } from "./arp-ui";

export function ArpSimulatorsPanel({ config }: { config: ArpConfig }) {
  const currency = config.identity.currency;

  // Prêt
  const [loanAmount, setLoanAmount] = useState(120000);
  const [loanPeriods, setLoanPeriods] = useState(3);
  const [loanRate, setLoanRate] = useState(3);
  const [loanMethod, setLoanMethod] = useState<AmortizationMethod>("CONSTANT_PRINCIPAL");

  const schedule = useMemo(() => {
    try {
      return buildAmortizationSchedule({
        principalMinor: toMinor(loanAmount, currency),
        periods: Math.max(1, Math.round(loanPeriods)),
        ratePctPerPeriod: loanRate,
        method: loanMethod,
      });
    } catch {
      return null;
    }
  }, [loanAmount, loanPeriods, loanRate, loanMethod, currency]);

  // Tontine
  const [pot, setPot] = useState(650000);
  const [right, setRight] = useState(300000);
  const [remaining, setRemaining] = useState(12);
  const [cap, setCap] = useState(2);
  const [fraction, setFraction] = useState(1);

  const attribution = useMemo(() => {
    try {
      return computeAttribution({
        potMinor: toMinor(pot, currency),
        beneficiaryRightMinor: toMinor(right, currency),
        remainingUnits: remaining,
        sessionCapUnits: cap,
        minFraction: fraction,
      });
    } catch {
      return null;
    }
  }, [pot, right, remaining, cap, fraction, currency]);

  // Solidarité
  const [members, setMembers] = useState(100);
  const [contribution, setContribution] = useState(6000);
  const [months, setMonths] = useState(12);
  const [recovery, setRecovery] = useState(90);

  const projected = useMemo(() => {
    try {
      return projectContributions({
        members,
        contributionMinor: toMinor(contribution, currency),
        months,
        recoveryPct: recovery,
      });
    } catch {
      return null;
    }
  }, [members, contribution, months, recovery, currency]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard
        title="Simulateur d'échéancier"
        description="Contrôle chiffré de l'annexe 02 : 120 000 XAF sur trois mois à 3 % par mois, principal constant."
        icon={<Calculator className="h-4 w-4" />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Capital"
            value={loanAmount}
            onChange={setLoanAmount}
            step={currency === "XAF" || currency === "XOF" ? 5000 : 10}
            suffix={currency}
          />
          <NumberField label="Échéances" value={loanPeriods} onChange={setLoanPeriods} min={1} max={360} />
          <NumberField
            label="Taux par période"
            value={loanRate}
            onChange={setLoanRate}
            min={0}
            step={0.5}
            suffix="%"
          />
          <SelectField
            label="Méthode"
            value={loanMethod}
            onChange={(v) => setLoanMethod(v as AmortizationMethod)}
            options={[
              { value: "CONSTANT_PRINCIPAL", label: "Principal constant" },
              { value: "CONSTANT_ANNUITY", label: "Annuité constante" },
              { value: "IN_FINE", label: "In fine" },
            ]}
          />
        </div>

        {schedule ? (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#efe9dd] text-[9.5px] uppercase tracking-wide text-[#8a8378]">
                    <th className="py-1.5 pr-2 font-semibold">#</th>
                    <th className="py-1.5 pr-2 font-semibold">Ouverture</th>
                    <th className="py-1.5 pr-2 font-semibold">Principal</th>
                    <th className="py-1.5 pr-2 font-semibold">Intérêt</th>
                    <th className="py-1.5 pr-2 font-semibold">Échéance</th>
                    <th className="py-1.5 font-semibold">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.lines.map((line) => (
                    <tr key={line.period} className="border-b border-[#f4f0e7] last:border-0">
                      <td className="py-1.5 pr-2 text-[#8a8378]">{line.period}</td>
                      <td className="py-1.5 pr-2">{formatMoney(line.openingMinor, currency)}</td>
                      <td className="py-1.5 pr-2">{formatMoney(line.principalMinor, currency)}</td>
                      <td className="py-1.5 pr-2">{formatMoney(line.interestMinor, currency)}</td>
                      <td className="py-1.5 pr-2 font-semibold">{formatMoney(line.paymentMinor, currency)}</td>
                      <td className="py-1.5">{formatMoney(line.closingMinor, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[#fbf9f3] px-2.5 py-2">
                <p className="text-[9.5px] uppercase text-[#8a8378]">Principal</p>
                <p className="text-[11px] font-bold">{formatMoney(schedule.principalMinor, currency)}</p>
              </div>
              <div className="rounded-lg bg-[#fffbf1] px-2.5 py-2">
                <p className="text-[9.5px] uppercase text-[#8a8378]">Intérêts</p>
                <p className="text-[11px] font-bold text-[#92400e]">
                  {formatMoney(schedule.interestMinor, currency)}
                </p>
              </div>
              <div className="rounded-lg bg-[#f7fcf8] px-2.5 py-2">
                <p className="text-[9.5px] uppercase text-[#8a8378]">Coût total</p>
                <p className="text-[11px] font-bold text-[#166534]">
                  {formatMoney(schedule.totalMinor, currency)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10.5px] leading-4 text-[#8a8378]">
              Le total des flux ne cache aucun frais dans le principal. Un taux nul utilise la
              branche dédiée A = P / n ; la dernière échéance absorbe le reliquat d&apos;arrondi.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-[#991b1b]">Paramètres invalides.</p>
        )}
      </SectionCard>

      <div className="space-y-4">
        <SectionCard
          title="Simulateur d'attribution de tontine"
          description="Le pot, le plafond de séance et les droits restants limitent la quantité attribuable (ATT01)."
          icon={<Coins className="h-4 w-4" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Pot disponible" value={pot} onChange={setPot} step={5000} suffix={currency} />
            <NumberField label="Droit par part" value={right} onChange={setRight} step={5000} suffix={currency} />
            <NumberField label="Droits restants" value={remaining} onChange={setRemaining} min={0} step={0.25} suffix="parts" />
            <NumberField label="Plafond de séance" value={cap} onChange={setCap} min={1} step={1} suffix="parts" />
            <NumberField label="Fraction minimale" value={fraction} onChange={setFraction} min={0.25} step={0.25} suffix="part" />
          </div>
          {attribution ? (
            <div className="mt-3 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] p-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9.5px] uppercase text-[#8a8378]">Parts attribuables</p>
                  <p className="text-sm font-bold text-[#0d3d28]">{attribution.units}</p>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase text-[#8a8378]">Montant</p>
                  <p className="text-sm font-bold">{formatMoney(attribution.amountMinor, currency)}</p>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase text-[#8a8378]">Reste au pot</p>
                  <p className="text-sm font-bold text-[#166534]">
                    {formatMoney(attribution.remainderMinor, currency)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10.5px] text-[#8a8378]">
                Limité par : {attribution.limitedBy.toLowerCase().replaceAll("_", " ")}. Aucune
                fraction n&apos;est arrondie en part entière pour obtenir un avantage (PAR04).
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#991b1b]">Paramètres invalides.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Prévision du fonds social"
          description="Une créance de cotisation n'est pas une entrée certaine : le taux de recouvrement est explicite (RES02)."
          icon={<HandCoins className="h-4 w-4" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Membres" value={members} onChange={setMembers} min={0} />
            <NumberField label="Cotisation mensuelle" value={contribution} onChange={setContribution} step={500} suffix={currency} />
            <NumberField label="Mois" value={months} onChange={setMonths} min={1} max={60} />
            <NumberField label="Taux de recouvrement" value={recovery} onChange={setRecovery} min={0} max={100} suffix="%" />
          </div>
          {projected !== null ? (
            <div className="mt-3 rounded-xl border border-[#e8e2d8] bg-[#f7fcf8] p-3">
              <p className="text-[9.5px] uppercase tracking-wide text-[#8a8378]">Entrées prévues</p>
              <p className="text-lg font-bold text-[#166534]">{formatMoney(projected, currency)}</p>
              <p className="mt-1 text-[10.5px] text-[#8a8378]">
                Soit {Number(fromMinor(projected, currency)).toLocaleString("fr-FR")} {currency} attendus —
                les événements simultanés et les aides déjà approuvées doivent être retirés séparément.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#991b1b]">Paramètres invalides.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
