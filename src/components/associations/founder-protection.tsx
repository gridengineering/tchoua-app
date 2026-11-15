"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Crown, Loader2, ShieldCheck, UserX } from "lucide-react";

type FounderState = {
  founder: { membershipId: string; name: string; email: string } | null;
  request: {
    id: string;
    proposedById: string;
    proposedByName: string;
    createdAt: string;
    confirmedByName: string | null;
  } | null;
  isFounder: boolean;
  isBureau: boolean;
  isProposer?: boolean;
  canPropose: boolean;
  canConfirm: boolean;
};

export function FounderProtection({ associationId }: { associationId: string }) {
  const [state, setState] = useState<FounderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"PROPOSE" | "CONFIRM" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/associations/${associationId}/founder-revocation`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
      setState(data);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erreur" });
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: "PROPOSE" | "CONFIRM") => {
    if (action === "PROPOSE" && !confirm("Proposer le retrait du privilège de fondateur ? Un second membre du bureau devra confirmer.")) return;
    if (action === "CONFIRM" && !confirm("Confirmer le retrait du privilège de fondateur ? Cette action prend effet immédiatement après votre confirmation.")) return;
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/associations/${associationId}/founder-revocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action impossible");
      setMessage({
        type: "success",
        text: action === "PROPOSE"
          ? "Proposition enregistrée. Un autre membre du bureau doit maintenant la confirmer."
          : "Le privilège de fondateur a été retiré. Le créateur reste membre de l'association.",
      });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erreur" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white">
      <div className="flex items-start gap-3 border-b border-[#f0ece4] px-5 py-4">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff7e8] text-[#b45309]">
          <Crown className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1a1a1a]">Protection du fondateur</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[#7a7368]">
            Le créateur conserve tous les droits de modification. Son privilège ne peut être retiré que par
            deux membres distincts du bureau : une proposition, puis une confirmation.
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-[#7a7368]"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
        ) : !state?.founder ? (
          <p className="text-sm text-[#7a7368]">Aucun fondateur actif n&apos;est identifié pour cette association.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fbf9f3] px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{state.founder.name}</p>
                <p className="text-xs text-[#7a7368]">{state.founder.email} · Fondateur / créateur</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ec] px-2 py-1 text-[11px] font-semibold text-[#166534]">
                <ShieldCheck className="h-3.5 w-3.5" /> Droits complets
              </span>
            </div>

            {state.isFounder ? (
              <p className="rounded-xl border border-[#cce8d4] bg-[#f7fcf8] px-3 py-2 text-xs leading-relaxed text-[#166534]">
                Vous êtes le fondateur : votre rôle reste complet. Seuls deux autres membres du bureau peuvent
                engager une procédure de retrait, et elle ne prend effet qu&apos;après leur confirmation.
              </p>
            ) : state.request ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4" /> Retrait en attente de confirmation
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Proposition de <strong>{state.request.proposedByName}</strong> le{" "}
                  {new Date(state.request.createdAt).toLocaleDateString("fr-FR")}. Un autre membre du bureau doit confirmer.
                </p>
                {state.canConfirm ? (
                  <button
                    onClick={() => act("CONFIRM")}
                    disabled={busy !== null}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {busy === "CONFIRM" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                    Confirmer le retrait (2/2)
                  </button>
                ) : (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    {state.isProposer
                      ? "Vous avez proposé ce retrait. Un autre membre du bureau doit le confirmer."
                      : "En attente de la confirmation d'un autre membre du bureau."}
                  </p>
                )}
              </div>
            ) : state.canPropose ? (
              <div>
                <button
                  onClick={() => act("PROPOSE")}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {busy === "PROPOSE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                  Proposer le retrait du privilège
                </button>
                <p className="mt-2 text-xs text-[#7a7368]">
                  Votre proposition devra être confirmée par un autre membre du bureau. Le fondateur restera membre.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#7a7368]">
                Cette procédure est réservée aux membres du bureau. Les administrateurs de la plateforme conservent
                leurs droits et ne peuvent pas être révoqués par un membre.
              </p>
            )}
          </>
        )}

        {message ? (
          <p className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${message.type === "success" ? "bg-[#f7fcf8] text-[#166534]" : "bg-[#fef6f6] text-[#991b1b]"}`}>
            {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />}
            {message.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
