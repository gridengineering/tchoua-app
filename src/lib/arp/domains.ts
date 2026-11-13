import raw from "@/data/arp-domaines.json";
import type { ArpDomain } from "./types";

type RawReferential = {
  source: string;
  generatedFrom: string;
  domains: ArpDomain[];
};

const referential = raw as RawReferential;

export const ARP_DOMAINS: ArpDomain[] = referential.domains;

export const ARP_REFERENTIAL_SOURCE = referential.source;
export const ARP_REFERENTIAL_FILE = referential.generatedFrom;

export const ARP_DOMAIN_STATS = {
  domains: ARP_DOMAINS.length,
  invariants: ARP_DOMAINS.reduce((n, d) => n + d.invariants.length, 0),
  formFields: ARP_DOMAINS.reduce((n, d) => n + d.form.length, 0),
  workflows: ARP_DOMAINS.reduce((n, d) => n + d.workflow.length, 0),
  tests: ARP_DOMAINS.reduce((n, d) => n + d.tests.length, 0),
  combinations: ARP_DOMAINS.reduce((n, d) => n + d.combinations.length, 0),
  indicators: ARP_DOMAINS.reduce((n, d) => n + d.indicators.length, 0),
};

export function getArpDomain(code: string): ArpDomain | undefined {
  return ARP_DOMAINS.find((d) => d.code === code);
}

export function searchArpDomains(query: string): ArpDomain[] {
  const q = query.trim().toLowerCase();
  if (!q) return ARP_DOMAINS;
  return ARP_DOMAINS.filter((domain) => {
    const haystack = [
      domain.code,
      domain.title,
      domain.intro,
      ...domain.options.map((o) => `${o.label} ${o.values} ${o.note}`),
      ...domain.invariants.map((i) => `${i.code} ${i.text}`),
      ...domain.form.map((f) => `${f.label} ${f.control}`),
      ...domain.tests.map((t) => `${t.case} ${t.expected}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
