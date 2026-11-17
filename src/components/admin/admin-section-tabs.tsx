"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, History, Landmark, Settings, ShieldCheck, Sliders, Wallet,
} from "lucide-react";

type GroupKey = "audit" | "compliance" | "wallets" | "settings";

const GROUPS: Record<GroupKey, { href: string; label: string; icon: any }[]> = {
  audit: [
    { href: "/admin/finance", label: "Audit financier", icon: Landmark },
    { href: "/admin/historique", label: "Historique complet", icon: History },
    { href: "/admin/audit", label: "Journaux système", icon: FileText },
  ],
  compliance: [
    { href: "/admin/kyc", label: "Conformité KYC", icon: ShieldCheck },
    { href: "/admin/confiance", label: "Confiance & Scores", icon: ShieldCheck },
  ],
  wallets: [
    { href: "/admin/wallets", label: "Supervision Wallets", icon: Wallet },
    { href: "/admin/settings/wallet", label: "Frais & Plafonds", icon: Sliders },
  ],
  settings: [
    { href: "/admin/settings", label: "Paramètres plateforme", icon: Settings },
    { href: "/admin/gouvernance", label: "Gouvernance & Mail", icon: ShieldCheck },
  ],
};

export function AdminSectionTabs({ group }: { group: GroupKey }) {
  const pathname = usePathname();
  const tabs = GROUPS[group];

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
