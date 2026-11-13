"use client";

import { FileClock, ShieldCheck } from "lucide-react";
import type { ArpVersionPayload } from "@/lib/arp/types";
import { EmptyHint, SectionCard, StatusPill } from "./arp-ui";

export function ArpVersionsPanel({ versions }: { versions: ArpVersionPayload[] }) {
  return (
    <SectionCard
      title="Versions publiées"
      description="Une version publiée est immuable. Chaque version conserve la configuration, les contrôles et une empreinte SHA-256."
      icon={<FileClock className="h-4 w-4" />}
    >
      {versions.length === 0 ? (
        <EmptyHint>Aucune version enregistrée.</EmptyHint>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#efe9dd] text-[10px] uppercase tracking-wide text-[#8a8378]">
                <th className="py-2 pr-3 font-semibold">Version</th>
                <th className="py-2 pr-3 font-semibold">Statut</th>
                <th className="py-2 pr-3 font-semibold">Origine</th>
                <th className="py-2 pr-3 font-semibold">Empreinte</th>
                <th className="py-2 pr-3 font-semibold">Date d&apos;effet</th>
                <th className="py-2 font-semibold">Créée le</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-b border-[#f4f0e7] last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold text-[#1f2937]">v{version.version}</td>
                  <td className="py-2 pr-3">
                    <StatusPill
                      tone={
                        version.status === "ACTIVE"
                          ? "green"
                          : version.status === "DRAFT"
                            ? "amber"
                            : "gray"
                      }
                    >
                      {version.status}
                    </StatusPill>
                  </td>
                  <td className="py-2 pr-3 text-[#57534e]">{version.origin}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] text-[#8a8378]">
                    {version.hash.slice(0, 12)}…
                  </td>
                  <td className="py-2 pr-3 text-[#57534e]">
                    {version.effectiveAt
                      ? new Date(version.effectiveAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="py-2 text-[#57534e]">
                    {new Date(version.createdAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#e8e2d8] bg-[#fbf9f3] px-3 py-2 text-[11px] leading-4 text-[#7a7368]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#0d3d28]" />
        <span>
          Les opérations anciennes restent rattachées à leur version de règle. Une correction
          rétroactive n&apos;écrase jamais l&apos;historique : elle crée une opération liée dans
          une période ouverte.
        </span>
      </div>
    </SectionCard>
  );
}
