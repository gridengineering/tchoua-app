"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Vérification de votre adresse e-mail…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid") ?? "";
    const code = params.get("code") ?? "";
    if (!uid || !code) {
      setState("error");
      setMessage("Ce lien de confirmation est incomplet.");
      return;
    }
    fetch(`/api/auth/verify-email?uid=${encodeURIComponent(uid)}&code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Ce lien est invalide ou expiré.");
        setState("ok");
        setMessage("Votre adresse e-mail est confirmée. Vous êtes maintenant au niveau KYC 1.");
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Ce lien est invalide ou expiré.");
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3eb] p-6">
      <div className="w-full max-w-md rounded-3xl border border-[#e5e0d4] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d3d28] text-white">
          {state === "loading" ? <Loader2 className="h-7 w-7 animate-spin" /> : state === "ok" ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
        </div>
        <h1 className="text-xl font-bold text-[#0d3d28]">
          {state === "loading" ? "Confirmation en cours" : state === "ok" ? "Adresse confirmée" : "Confirmation impossible"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        {state !== "loading" && (
          <Link
            href={state === "ok" ? "/login?verified=1" : "/login"}
            className="mt-6 inline-flex rounded-xl bg-[#0d3d28] px-5 py-3 text-sm font-bold text-white"
          >
            {state === "ok" ? "Se connecter" : "Retour à la connexion"}
          </Link>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f7f3eb]"><Loader2 className="h-8 w-8 animate-spin text-[#0d3d28]" /></main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
