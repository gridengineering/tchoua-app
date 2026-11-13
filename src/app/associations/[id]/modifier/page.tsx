"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  AssociationFormWorkspace,
  type AssociationFormInitial,
} from "@/components/associations/association-form-workspace";
import type { ArpConfig } from "@/lib/arp/types";

const EDIT_ROLES = ["FOUNDER", "PRESIDENT", "VICE_PRESIDENT"];

type AssociationPayload = {
  association: {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    color?: string;
    logo?: string | null;
    region?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    parentId?: string | null;
    parentSubscriptionFee?: number | null;
    isPublic?: boolean;
    meetingConfig?: string | null;
    membershipConfig?: string | null;
    socialAidCaps?: string | null;
    sanctionsConfig?: string | null;
    bankConfig?: string | null;
    regulations?: Array<{ id?: string; title?: string | null; content: string }>;
    activities?: Array<{ id: string; name: string; type: string; status?: string; contributionAmount?: number | null }>;
  };
  myRole: string | null;
};

export default function EditAssociationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const [initial, setInitial] = useState<AssociationFormInitial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [associationResponse, arpResponse] = await Promise.all([
          fetch(`/api/associations/${id}`, { cache: "no-store" }),
          fetch(`/api/associations/${id}/arp`, { cache: "no-store" }),
        ]);
        const associationPayload = (await associationResponse.json()) as AssociationPayload & { error?: string };
        const arpPayload = (await arpResponse.json()) as { config?: ArpConfig; error?: string };
        if (!associationResponse.ok) throw new Error(associationPayload.error ?? "Association introuvable");
        if (!arpResponse.ok) throw new Error(arpPayload.error ?? "Cadre ARP indisponible");
        if (cancelled) return;
        setMyRole(associationPayload.myRole);
        setInitial({
          ...associationPayload.association,
          arpConfig: arpPayload.config,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isPrincipalAdmin =
    session?.user?.email?.toLowerCase() === "admin@tchoua.com";
  const canEdit = isPrincipalAdmin || (myRole ? EDIT_ROLES.includes(myRole) : false);
  const sessionPending = sessionStatus === "loading";

  if (loading || sessionPending) {
    return (
      <DashboardLayout title="Modifier l'association">
        <div className="flex items-center justify-center gap-2 p-16 text-sm text-[#8a8378]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement de l&apos;association…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !initial) {
    return (
      <DashboardLayout title="Modifier l'association">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f3cdcd] bg-[#fef6f6] p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-[#b91c1c]" />
          <p className="font-semibold text-[#991b1b]">{error ?? "Association introuvable"}</p>
          <Link href={`/associations/${id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d3d28]">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!canEdit) {
    return (
      <DashboardLayout title={`Modifier — ${initial.name}`}>
        <div className="mx-auto max-w-lg rounded-2xl border border-[#f2dfb8] bg-[#fffbf1] p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-[#b45309]" />
          <p className="font-semibold text-[#92400e]">Modification réservée au bureau</p>
          <p className="mt-1 text-sm text-[#7a7368]">
            Seuls le président, le fondateur, le vice-président ou l&apos;administrateur principal
            peuvent modifier l&apos;association. Votre rôle : {myRole ?? "aucun"}.
          </p>
          <Link href={`/associations/${id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d3d28]">
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;association
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return <AssociationFormWorkspace mode="edit" associationId={id} initial={initial} />;
}
