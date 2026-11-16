"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ConfirmContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<{
    loading: boolean;
    ok: boolean;
    message: string;
    associationName?: string;
    kycLevel?: number;
  }>({
    loading: true,
    ok: false,
    message: "Vérification de votre invitation en cours...",
  });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, ok: false, message: "Jeton d'invitation manquant." });
      return;
    }
    fetch(`/api/invites/confirm?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Lien invalide ou expiré.");
        }
        setState({
          loading: false,
          ok: true,
          message: `Votre accès à "${data.association?.name}" est confirmé et votre compte est passé au niveau KYC${data.kycLevel ?? 1}.`,
          associationName: data.association?.name,
          kycLevel: data.kycLevel,
        });
      })
      .catch((err) => {
        setState({ loading: false, ok: false, message: err.message });
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f7f3eb]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
        <div className="text-4xl mb-4">{state.loading ? "⏳" : state.ok ? "✅" : "⚠️"}</div>
        <h1 className="text-xl font-bold text-[#0d3d28] mb-2">
          {state.loading
            ? "Confirmation en cours"
            : state.ok
            ? "Accès confirmé · KYC1 activé"
            : "Invitation non valide"}
        </h1>
        <p className="text-sm text-gray-600 mb-6">{state.message}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-block bg-[#0d3d28] text-white font-semibold py-3 px-5 rounded-xl"
          >
            Accéder à Tchoua Web
          </Link>
          <Link
            href="/mobile"
            className="inline-block border border-[#0d3d28] text-[#0d3d28] font-semibold py-3 px-5 rounded-xl"
          >
            Télécharger l&apos;application mobile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmInvitePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
