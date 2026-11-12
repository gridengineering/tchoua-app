"use client";

import Link from "next/link";
import {
  ArrowUpRight, BarChart3, Calendar, Coins, GraduationCap, Heart, Landmark,
  MessageCircle, PiggyBank, Plus, RotateCcw, ShoppingBag, Users, Wallet,
} from "lucide-react";

const MODULES = [
  { href: "/tontines", label: "Tontines", desc: "Cycles & tirages", icon: PiggyBank },
  { href: "/epargne", label: "Épargne", desc: "Objectifs & projection", icon: Landmark },
  { href: "/prets", label: "Prêts", desc: "Demandes & remboursements", icon: Coins },
  { href: "/solidarite", label: "Solidarité", desc: "Aides & urgences", icon: Heart },
  { href: "/sessions", label: "Sessions", desc: "Séances & cotisations", icon: RotateCcw },
  { href: "/membres", label: "Membres", desc: "Annuaire & rôles", icon: Users },
  { href: "/rapports", label: "Rapports", desc: "Exports & analyses", icon: BarChart3 },
  { href: "/dashboard/wallet", label: "Portefeuille", desc: "Solde & opérations", icon: Wallet },
  { href: "/marketplace", label: "Marketplace", desc: "Annonces & achats groupés", icon: ShoppingBag },
  { href: "/chat", label: "Chat", desc: "Canaux de l'association", icon: MessageCircle },
  { href: "/dashboard/calendrier", label: "Calendrier", desc: "Échéances & réunions", icon: Calendar },
  { href: "/academie", label: "Académie", desc: "Guides & formation", icon: GraduationCap },
];

export function MemberLaunchpad() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] m-accent-text">Launchpad</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight m-text">Vos modules</h2>
          <p className="mt-1 text-sm m-muted">Un accès direct à chaque outil, sans détour.</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link href="/sessions" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border m-border m-surface px-3 py-1.5 text-xs font-semibold m-text transition hover:brightness-105">
            <Coins className="h-3.5 w-3.5" /> Cotiser
          </Link>
          <Link href="/prets" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border m-border m-surface px-3 py-1.5 text-xs font-semibold m-text transition hover:brightness-105">
            <Landmark className="h-3.5 w-3.5" /> Demander un prêt
          </Link>
          <Link href="/dashboard/associations/create" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full m-accent-bg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110">
            <Plus className="h-3.5 w-3.5" /> Nouvelle association
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-2xl border m-border m-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--m-accent)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl m-accent-soft m-accent-text transition-transform group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold m-text">{m.label}</div>
              <div className="mt-0.5 line-clamp-1 text-[11px] m-muted">{m.desc}</div>
              <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 m-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
