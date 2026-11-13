"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Gauge,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ARP_DIMENSIONS } from "@/lib/arp/catalogue";
import type { ArpDomain } from "@/lib/arp/types";

type AdminRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  members: number;
  activities: number;
  funds: number;
  arp: {
    status: string;
    origin: string;
    version: number;
    structure: string;
    effectiveAt: string | null;
    hasDraft: boolean;
    completeness: number;
    errors: number;
    warnings: number;
    conditions: string[];
    capabilities: Record<string, boolean> | null;
    currency: string;
  } | null;
};

type AdminPayload = {
  rows: AdminRow[];
  stats: {
    associations: number;
    active: number;
    draft: number;
    backfill: number;
    versions: number;
    averageCompleteness: number;
    domains: number;
    invariants: number;
    catalogueSize: number;
  };
};

type Referential = {
  source: string;
  stats: {
    domains: number;
    invariants: number;
    formFields: number;
    workflows: number;
    tests: number;
    combinations: number;
    indicators: number;
  };
  dimensions: typeof ARP_DIMENSIONS;
  conditions: Array<{ code: string; label: string; message: string; minVersion: string }>;
  catalogueSize: number;
  domains: ArpDomain[];
};

export default function AdminArpPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [referential, setReferential] = useState<Referential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"couverture" | "referentiel">("couverture");
  const [query, setQuery] = useState("");
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [coverageResponse, referentialResponse] = await Promise.all([
          fetch("/api/admin/arp", { cache: "no-store" }),
          fetch("/api/arp/referential", { cache: "no-store" }),
        ]);
        const coverage = await coverageResponse.json();
        const ref = await referentialResponse.json();
        if (!coverageResponse.ok) throw new Error(coverage.error ?? "Accès refusé");
        if (!referentialResponse.ok) throw new Error(ref.error ?? "Référentiel indisponible");
        if (!cancelled) {
          setData(coverage as AdminPayload);
          setReferential(ref as Referential);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const backfill = async () => {
    setBackfilling(true);
    setBackfillMessage(null);
    try {
      const response = await fetch("/api/admin/arp/backfill", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Initialisation refusée");
      setBackfillMessage(
        `${payload.created} profil(s) créé(s), ${payload.existing} déjà présent(s), ${payload.failed} échec(s).`
      );
      const refreshed = await fetch("/api/admin/arp", { cache: "no-store" });
      if (refreshed.ok) setData((await refreshed.json()) as AdminPayload);
    } catch (err) {
      setBackfillMessage(err instanceof Error ? err.message : "Erreur d'initialisation");
    } finally {
      setBackfilling(false);
    }
  };

  const filteredDomains = useMemo(() => {
    if (!referential) return [];
    const q = query.trim().toLowerCase();
    if (!q) return referential.domains;
    return referential.domains.filter((domain) => {
      const haystack = [
        domain.code,
        domain.title,
        domain.intro,
        ...domain.options.map((o) => `${o.label} ${o.values} ${o.note}`),
        ...domain.invariants.map((i) => `${i.code} ${i.text}`),
        ...domain.tests.map((t) => `${t.case} ${t.expected}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [referential, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm text-[#8a8378]">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement du référentiel ARP…
      </div>
    );
  }
  if (error || !data || !referential) {
    return (
      <div className="rounded-2xl border border-[#f3cdcd] bg-[#fef6f6] p-6 text-sm text-[#991b1b]">
        {error ?? "Données indisponibles"}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8378]">
            Tchoua Association Resource Planning
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1a1a1a]">Référentiel ARP</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">
            Étude fonctionnelle et technique du 13 novembre 2026. 36 domaines, 144 invariants,
            un catalogue de 23 328 combinaisons et un noyau commun de contrats, droits,
            obligations, paiements et mouvements traçables.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={backfill}
            disabled={backfilling}
            className="rounded-lg border border-[#cfe0d5] bg-[#f6fbf7] px-3 py-2 text-xs font-semibold text-[#0d3d28] disabled:opacity-50"
          >
            {backfilling ? "Initialisation…" : "Initialiser les profils manquants"}
          </button>
          <Link
            href="/admin/associations"
            className="rounded-lg border border-[#ddd6c8] bg-white px-3 py-2 text-xs font-semibold text-[#57534e]"
          >
            Associations
          </Link>
          <Link
            href="/documentation"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-3 py-2 text-xs font-semibold text-white"
          >
            <BookOpen className="h-3.5 w-3.5" /> Manuel
          </Link>
        </div>
      </div>

      {backfillMessage ? (
        <div className="rounded-xl border border-[#cfdffc] bg-[#eef4ff] px-4 py-2.5 text-[11.5px] text-[#1e40af]">
          {backfillMessage}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Boxes className="h-4 w-4" />} label="Associations" value={data.stats.associations} hint={`${data.stats.active} cadres actifs`} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Complétude moyenne" value={`${data.stats.averageCompleteness}%`} hint={`${data.stats.draft} brouillon(s), ${data.stats.backfill} importé(s)`} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Versions publiées" value={data.stats.versions} hint="Configuration immuable et empreinte SHA-256" />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Combinaisons" value={data.stats.catalogueSize.toLocaleString("fr-FR")} hint={`${data.stats.domains} domaines · ${data.stats.invariants} invariants`} />
      </div>

      <div className="flex gap-1 rounded-xl border border-[#e8e2d8] bg-[#fbf9f3] p-1">
        <button
          type="button"
          onClick={() => setTab("couverture")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
            tab === "couverture" ? "bg-white text-[#0d3d28] shadow-sm" : "text-[#7a7368]"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Couverture des associations
        </button>
        <button
          type="button"
          onClick={() => setTab("referentiel")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
            tab === "referentiel" ? "bg-white text-[#0d3d28] shadow-sm" : "text-[#7a7368]"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> Les 36 domaines
        </button>
      </div>

      {tab === "couverture" ? (
        <CoverageTable rows={data.rows} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e8e2d8] bg-[#fffdf9] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#1a1a1a]">Référentiel des domaines</h2>
                <p className="mt-0.5 text-[11px] text-[#8a8378]">
                  {referential.source}
                </p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a8a093]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un invariant, un test, une option…"
                  className="w-full rounded-lg border border-[#e2ddd4] bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-[#0d3d28]"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-[#e4dfd5] bg-[#fbf9f3] px-2 py-1 text-[10.5px] text-[#57534e]">
                {referential.stats.domains} domaines
              </span>
              <span className="rounded-md border border-[#e4dfd5] bg-[#fbf9f3] px-2 py-1 text-[10.5px] text-[#57534e]">
                {referential.stats.invariants} invariants
              </span>
              <span className="rounded-md border border-[#e4dfd5] bg-[#fbf9f3] px-2 py-1 text-[10.5px] text-[#57534e]">
                {referential.stats.formFields} champs de formulaire
              </span>
              <span className="rounded-md border border-[#e4dfd5] bg-[#fbf9f3] px-2 py-1 text-[10.5px] text-[#57534e]">
                {referential.stats.workflows} étapes de workflow
              </span>
              <span className="rounded-md border border-[#e4dfd5] bg-[#fbf9f3] px-2 py-1 text-[10.5px] text-[#57534e]">
                {referential.stats.tests} recettes
              </span>
              <span className="rounded-md border border-[#e4dfd5] bg-[#fbf9f3] px-2 py-1 text-[10.5px] text-[#57534e]">
                {referential.catalogueSize.toLocaleString("fr-FR")} combinaisons
              </span>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {filteredDomains.map((domain) => (
              <DomainCard key={domain.code} domain={domain} />
            ))}
          </div>
          {filteredDomains.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#ddd6c8] bg-[#fbf9f3] p-6 text-center text-sm text-[#8a8378]">
              Aucun domaine ne correspond à « {query} ».
            </p>
          ) : null}

          <div className="rounded-2xl border border-[#e8e2d8] bg-[#fffdf9] p-4">
            <h3 className="text-sm font-bold text-[#1a1a1a]">Dimensions du catalogue</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {referential.dimensions.map((dimension) => (
                <div key={dimension.key} className="rounded-lg border border-[#eee8dc] bg-white p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">
                    {dimension.short}
                  </p>
                  <p className="mt-1 text-[11px] text-[#3f3a33]">
                    {dimension.values.map((value) => value.label).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {referential.conditions.map((condition) => (
                <div key={condition.code} className="flex gap-2 text-[11px] leading-4">
                  <span className="font-mono font-bold text-[#0d3d28]">{condition.code}</span>
                  <span className="font-semibold text-[#3f3a33]">{condition.label}</span>
                  <span className="text-[#7a7368]">— {condition.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e2d8] bg-[#fffdf9] p-4">
      <div className="flex items-center gap-2 text-[#0d3d28]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d3d28]/8">{icon}</span>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8378]">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-[#1a1a1a]">{value}</p>
      <p className="mt-0.5 text-[10.5px] leading-4 text-[#8a8378]">{hint}</p>
    </div>
  );
}

function CoverageTable({ rows }: { rows: AdminRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e2d8] bg-[#fffdf9]">
      <div className="border-b border-[#efe9dd] px-5 py-3.5">
        <h2 className="text-sm font-bold text-[#1a1a1a]">Couverture des associations</h2>
        <p className="mt-0.5 text-[11px] text-[#8a8378]">
          Un profil importé (BACKFILL) est actif pour ne pas interrompre l&apos;existant ; il doit
          être revu et publié par le bureau.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#efe9dd] text-[9.5px] uppercase tracking-wide text-[#8a8378]">
              <th className="px-4 py-2.5 font-semibold">Association</th>
              <th className="px-3 py-2.5 font-semibold">Type</th>
              <th className="px-3 py-2.5 font-semibold">Cadre ARP</th>
              <th className="px-3 py-2.5 font-semibold">Version</th>
              <th className="px-3 py-2.5 font-semibold">Complétude</th>
              <th className="px-3 py-2.5 font-semibold">Modules</th>
              <th className="px-3 py-2.5 font-semibold">Fonds</th>
              <th className="px-3 py-2.5 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const modules = row.arp?.capabilities
                ? Object.entries(row.arp.capabilities)
                    .filter(([, value]) => value)
                    .map(([key]) => key)
                : [];
              return (
                <tr key={row.id} className="border-b border-[#f4f0e7] last:border-0 hover:bg-[#fbf9f3]">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-[#1f2937]">{row.name}</p>
                    <p className="text-[10px] text-[#a8a093]">
                      {row.members} membre(s) · {row.activities} activité(s)
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-[#57534e]">{row.type}</td>
                  <td className="px-3 py-2.5">
                    {row.arp ? (
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase ${
                          row.arp.status === "ACTIVE"
                            ? "border-[#cce8d4] bg-[#f7fcf8] text-[#166534]"
                            : "border-[#f2dfb8] bg-[#fffbf1] text-[#92400e]"
                        }`}
                      >
                        {row.arp.status} · {row.arp.origin}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#a8a093]">
                        <CircleDashed className="h-3 w-3" /> non initialisé
                      </span>
                    )}
                    {row.arp?.hasDraft ? (
                      <p className="mt-0.5 text-[9.5px] text-[#1e40af]">brouillon en attente</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[#57534e]">v{row.arp?.version ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e9e4da]">
                        <div
                          className="h-full rounded-full bg-[#0d3d28]"
                          style={{ width: `${row.arp?.completeness ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[#57534e]">
                        {row.arp?.completeness ?? 0}%
                      </span>
                    </div>
                    {row.arp && (row.arp.errors > 0 || row.arp.warnings > 0) ? (
                      <p className="mt-0.5 text-[9px] text-[#92400e]">
                        {row.arp.errors} erreur(s) · {row.arp.warnings} alerte(s)
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {modules.slice(0, 4).map((module) => (
                        <span
                          key={module}
                          className="rounded border border-[#e4dfd5] bg-white px-1 py-0.5 text-[8.5px] font-medium text-[#57534e]"
                        >
                          {module}
                        </span>
                      ))}
                      {modules.length > 4 ? (
                        <span className="text-[9px] text-[#a8a093]">+{modules.length - 4}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#57534e]">{row.funds}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/associations/${row.id}/arp`}
                        className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#0d3d28] hover:underline"
                      >
                        Cadre ARP <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href={`/associations/${row.id}/configuration`}
                        className="text-[10px] font-semibold text-[#1e40af] hover:underline"
                      >
                        Configurer
                      </Link>
                      <Link
                        href={`/associations/${row.id}/modifier`}
                        className="text-[10px] font-semibold text-[#57534e] hover:underline"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DomainCard({ domain }: { domain: ArpDomain }) {
  return (
    <details className="group rounded-2xl border border-[#e8e2d8] bg-[#fffdf9]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0d3d28]/8 font-mono text-[11px] font-bold text-[#0d3d28]">
            {domain.code}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a]">{domain.title}</p>
            <p className="mt-0.5 text-[10px] text-[#a8a093]">Référence manuel : {domain.reference}</p>
          </div>
        </div>
        <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0 text-[#a8a093] transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-[#efe9dd] px-4 py-4">
        <p className="text-[11.5px] leading-5 text-[#57534e]">{domain.intro}</p>

        <Block title={`Invariants (${domain.invariants.length})`}>
          {domain.invariants.map((invariant) => (
            <p key={invariant.code} className="text-[11px] leading-4 text-[#3f3a33]">
              <span className="mr-1 font-mono font-bold text-[#0d3d28]">{invariant.code}</span>
              {invariant.text}
            </p>
          ))}
        </Block>

        <Block title={`Options (${domain.options.length})`}>
          {domain.options.map((option) => (
            <p key={option.label} className="text-[11px] leading-4 text-[#3f3a33]">
              <span className="font-semibold">{option.label}</span> — {option.values}
              {option.note ? <span className="text-[#8a8378]"> · {option.note}</span> : null}
            </p>
          ))}
        </Block>

        <Block title={`Workflow (${domain.workflow.length})`}>
          {domain.workflow.map((step, index) => (
            <p key={`${step.actor}-${index}`} className="text-[11px] leading-4 text-[#3f3a33]">
              <span className="font-mono text-[9.5px] text-[#a8a093]">{index + 1}.</span>{" "}
              <span className="font-semibold">{step.actor}</span> — {step.action}
              {step.control ? <span className="text-[#8a8378]"> ({step.control})</span> : null}
            </p>
          ))}
        </Block>

        <Block title={`Recettes (${domain.tests.length})`}>
          {domain.tests.map((test) => (
            <p key={test.case} className="text-[11px] leading-4 text-[#3f3a33]">
              <span className="font-semibold">{test.case}</span> — {test.expected}
            </p>
          ))}
        </Block>

        <Block title={`Indicateurs (${domain.indicators.length})`}>
          {domain.indicators.map((indicator) => (
            <p key={indicator.name} className="text-[11px] leading-4 text-[#3f3a33]">
              <span className="font-semibold">{indicator.name}</span> — {indicator.formula}
            </p>
          ))}
        </Block>
      </div>
    </details>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8378]">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
