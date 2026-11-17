"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { navText } from "@/lib/i18n/member-nav";
import { CalendarClock, Layers3, Settings2, ShieldCheck } from "lucide-react";

const TABS = (id: string) => [
  { href: `/associations/${id}/modifier`, label: "Informations", icon: Settings2 },
  { href: `/associations/${id}/configuration`, label: "Activités & cadres", icon: Layers3 },
  { href: `/associations/${id}/arp`, label: "Cadre ARP", icon: CalendarClock },
  { href: `/associations/${id}/parametres`, label: "Sécurité & rôles", icon: ShieldCheck },
];

export function AssociationSettingsTabs({ associationId }: { associationId: string }) {
  const pathname = usePathname();
  const { lang } = useI18n();
  return (
    <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-stone bg-white p-2">
      {TABS(associationId).map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${active ? "bg-[#0d3d28] text-white" : "text-graphite hover:bg-[#f6f3ec]"}`}
          >
            <Icon className="h-3.5 w-3.5" /> {navText(tab.label, lang)}
          </Link>
        );
      })}
    </div>
  );
}
