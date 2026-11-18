"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, Handshake, Image, LockKeyhole, MessageCircle, Scale, ShieldCheck, Tag } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const RULES = [
  {
    icon: BadgeCheck,
    title: "Décrivez avec exactitude",
    text: "Indiquez la nature réelle du bien, du service, de l'offre ou de l'événement. Les photos doivent être récentes et représenter l'objet réel. Un prix, un délai et un lieu clairs évitent les malentendus.",
  },
  {
    icon: Scale,
    title: "Respectez la loi et les statuts",
    text: "Aucune annonce illicite, trompeuse, discriminatoire ou contraire aux statuts de votre association. Les produits réglementés doivent respecter les autorisations en vigueur.",
  },
  {
    icon: LockKeyhole,
    title: "Protégez vos informations",
    text: "Ne publiez pas de données sensibles (pièce d'identité, RIB complet, mots de passe). Privilégiez le chat interne pour les premiers échanges et ne partagez vos coordonnées qu'avec un interlocuteur identifié.",
  },
  {
    icon: MessageCircle,
    title: "Communiquez dans le chat",
    text: "Le bouton « Discuter avec l'annonceur » crée une conversation privée liée à l'annonce. Conservez les échanges importants dans le chat afin de garder une trace en cas de désaccord.",
  },
  {
    icon: Handshake,
    title: "Confirmez avant de payer",
    text: "Vérifiez l'identité du vendeur, l'état du bien ou la prestation avant tout règlement. Pour les montants importants, privilégiez un échange en personne ou un moyen de paiement traçable.",
  },
  {
    icon: Image,
    title: "Soignez la présentation",
    text: "Une annonce avec une photo nette, un titre précis et une description complète reçoit davantage de réponses. Évitez les majuscules, les promesses excessives et les liens externes non vérifiés.",
  },
];

export default function MarketplaceGuidelinesPage() {
  return (
    <DashboardLayout title="Bonnes pratiques Marketplace">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d3d28] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à la marketplace
        </Link>

        <div className="rounded-3xl border border-[#dbe7dd] bg-gradient-to-br from-[#f6fbf7] to-[#fbf8ef] p-6 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0d3d28]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0d3d28]">
            <ShieldCheck className="h-4 w-4" /> Charte des petites annonces
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Publier et échanger en confiance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            La marketplace Tchoua relie les membres de vos associations. Ces règles protègent les annonceurs,
            les acheteurs et la réputation du réseau. Elles s'appliquent à tous les types d'annonces :
            vente, publication, recrutement, événement et partenariat.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {RULES.map((rule) => (
            <div key={rule.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d3d28]/8 text-[#0d3d28]"><rule.icon className="h-5 w-5" /></span>
              <h2 className="mt-3 text-sm font-bold text-slate-900">{rule.title}</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{rule.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Tag className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">Annonce signalée ou non conforme</h2>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Un membre peut signaler une annonce au bureau de son association ou à l'administration Tchoua.
                Les annonces manifestement frauduleuses, illicites ou contraires aux statuts peuvent être retirées
                et l'auteur peut perdre l'accès à la marketplace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0d3d28] p-5 text-white">
          <div><p className="text-sm font-bold">Prêt à publier ?</p><p className="mt-0.5 text-xs text-white/70">Choisissez le bon type d'annonce et renseignez les informations essentielles.</p></div>
          <Link href="/marketplace" className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0d3d28] hover:bg-white/90">Publier une annonce</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
