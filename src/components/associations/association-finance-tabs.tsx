"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Coins, History, TrendingUp } from "lucide-react";

export function AssociationFinanceTabs({ associationId }: { associationId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/associations/${associationId}/rapports`, label: "Rapports", icon: BarChart3 },
    { href: `/associations/${associationId}/historique`, label: "Historique", icon: History },
    { href: `/associations/${associationId}/interets`, label: "Intérêts", icon: TrendingUp },
    { href: `/associations/${associationId}/dividendes`, label: "Dividendes", icon: Coins },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-forest text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
