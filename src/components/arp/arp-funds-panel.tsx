"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Landmark,
  LockKeyhole,
  Plus,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/lib/arp/money";
import type { ArpFundPayload } from "@/lib/arp/types";
import {
  ARP_INPUT,
  EmptyHint,
  Field,
  NumberField,
  SectionCard,
  SelectField,
  StatusPill,
  TextField,
} from "./arp-ui";

type FormState =
  | { kind: "movement"; fundId: string; direction: "IN" | "OUT" }
  | { kind: "reservation"; fundId: string }
  | null;

export function ArpFundsPanel({
  associationId,
  funds,
  canEdit,
  reload,
}: {
  associationId: string;
  funds: ArpFundPayload[];
  canEdit: boolean;
  reload: () => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [fundDraft, setFundDraft] = useState({
    code: "",
    name: "",
    type: "LIBRE",
    currency: "",
  });
  const [movementDraft, setMovementDraft] = useState({
    amount: "",
    valueDate: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [reservationDraft, setReservationDraft] = useState({
    amount: "",
    purpose: "",
    expiresAt: "",
  });

  const currencyOf = funds[0]?.currency ?? "XAF";

  const call = async (url: string, init: RequestInit) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Opération refusée");
      }
      await reload();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const createFund = async () => {
    const data = await call(`/api/associations/${associationId}/arp/funds`, {
      method: "POST",
      body: JSON.stringify({
        ...fundDraft,
        currency: fundDraft.currency || currencyOf,
      }),
    });
    if (data) {
      setCreating(false);
      setFundDraft({ code: "", name: "", type: "LIBRE", currency: "" });
    }
  };

  const postMovement = async () => {
    if (!form || form.kind !== "movement") return;
    const data = await call(
      `/api/associations/${associationId}/arp/funds/${form.fundId}/movements`,
      {
        method: "POST",
        body: JSON.stringify({
          direction: form.direction,
          amount: movementDraft.amount,
          valueDate: movementDraft.valueDate,
          description: movementDraft.description,
        }),
      }
    );
    if (data) {
      setForm(null);
      setMovementDraft({ amount: "", valueDate: new Date().toISOString().slice(0, 10), description: "" });
    }
  };

  const postReservation = async () => {
    if (!form || form.kind !== "reservation") return;
    const data = await call(
      `/api/associations/${associationId}/arp/funds/${form.fundId}/reservations`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: reservationDraft.amount,
          purpose: reservationDraft.purpose,
          expiresAt: reservationDraft.expiresAt || null,
        }),
      }
    );
    if (data) {
      setForm(null);
      setReservationDraft({ amount: "", purpose: "", expiresAt: "" });
    }
  };

  const closeReservation = async (fundId: string, reservationId: string, action: "release" | "consume") => {
    await call(
      `/api/associations/${associationId}/arp/funds/${fundId}/reservations/${reservationId}`,
      { method: "PATCH", body: JSON.stringify({ action }) }
    );
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Fonds et comptes distincts"
        description="Le lieu de conservation ne définit pas l'usage autorisé. Disponible = solde - réservations actives (FIN03)."
        icon={<Landmark className="h-4 w-4" />}
        actions={
          canEdit ? (
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3d28] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a2f1f]"
            >
              <Plus className="h-3.5 w-3.5" /> Nouveau fonds
            </button>
          ) : null
        }
      >
        {error ? (
          <div className="mb-3 rounded-lg border border-[#f3cdcd] bg-[#fef6f6] px-3 py-2 text-[11.5px] text-[#991b1b]">
            {error}
          </div>
        ) : null}

        {creating ? (
          <div className="mb-4 rounded-xl border border-[#d8d1c3] bg-[#fbf9f3] p-3.5">
            <div className="grid gap-3 md:grid-cols-4">
              <TextField
                label="Code"
                value={fundDraft.code}
                onChange={(v) => setFundDraft({ ...fundDraft, code: v.toUpperCase() })}
                placeholder="CAISSE-GENERALE"
              />
              <TextField
                label="Nom"
                value={fundDraft.name}
                onChange={(v) => setFundDraft({ ...fundDraft, name: v })}
                placeholder="Caisse générale"
              />
              <SelectField
                label="Type"
                value={fundDraft.type}
                onChange={(v) => setFundDraft({ ...fundDraft, type: v })}
                options={[
                  { value: "LIBRE", label: "Libre" },
                  { value: "AFFECTE", label: "Affecté" },
                  { value: "RESERVE", label: "Réserve" },
                  { value: "DEPOT", label: "Dépôt remboursable" },
                ]}
              />
              <TextField
                label="Devise"
                value={fundDraft.currency}
                onChange={(v) => setFundDraft({ ...fundDraft, currency: v.toUpperCase().slice(0, 3) })}
                placeholder={currencyOf}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={createFund}
                className="rounded-lg bg-[#0d3d28] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Créer le fonds
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg border border-[#ddd6c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#57534e]"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : null}

        {funds.length === 0 ? (
          <EmptyHint>
            Aucun fonds n&apos;est encore ouvert. Créez au moins une caisse libre, puis
            enregistrez les mouvements confirmés. Les réservations protègent le disponible
            sans modifier le solde comptable.
          </EmptyHint>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {funds.map((fund) => {
              const activeReservations = (fund.reservations ?? []).filter((r) => r.status === "ACTIVE");
              return (
                <div key={fund.id} className="rounded-xl border border-[#e8e2d8] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1a1a1a]">{fund.name}</h4>
                        <StatusPill tone={fund.status === "ACTIVE" ? "green" : "gray"}>
                          {fund.status === "ACTIVE" ? "Actif" : "Clôturé"}
                        </StatusPill>
                      </div>
                      <p className="mt-0.5 font-mono text-[10.5px] text-[#8a8378]">
                        {fund.code} · {fund.type}
                      </p>
                    </div>
                    <Wallet className="h-4 w-4 text-[#0d3d28]" />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#fbf9f3] px-2.5 py-2">
                      <p className="text-[9.5px] uppercase tracking-wide text-[#8a8378]">Solde</p>
                      <p className="mt-0.5 text-xs font-bold text-[#1f2937]">
                        {formatMoney(fund.balanceMinor, fund.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#fffbf1] px-2.5 py-2">
                      <p className="text-[9.5px] uppercase tracking-wide text-[#8a8378]">Réservé</p>
                      <p className="mt-0.5 text-xs font-bold text-[#92400e]">
                        {formatMoney(fund.reservedMinor, fund.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#f7fcf8] px-2.5 py-2">
                      <p className="text-[9.5px] uppercase tracking-wide text-[#8a8378]">Disponible</p>
                      <p className="mt-0.5 text-xs font-bold text-[#166534]">
                        {formatMoney(fund.availableMinor, fund.currency)}
                      </p>
                    </div>
                  </div>

                  {canEdit && fund.status === "ACTIVE" ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setForm({ kind: "movement", fundId: fund.id, direction: "IN" })}
                        className="inline-flex items-center gap-1 rounded-md border border-[#cce8d4] bg-[#f7fcf8] px-2 py-1 text-[11px] font-semibold text-[#166534]"
                      >
                        <ArrowDownLeft className="h-3 w-3" /> Entrée
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ kind: "movement", fundId: fund.id, direction: "OUT" })}
                        className="inline-flex items-center gap-1 rounded-md border border-[#f3cdcd] bg-[#fef6f6] px-2 py-1 text-[11px] font-semibold text-[#991b1b]"
                      >
                        <ArrowUpRight className="h-3 w-3" /> Sortie
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ kind: "reservation", fundId: fund.id })}
                        className="inline-flex items-center gap-1 rounded-md border border-[#cfdffc] bg-[#eef4ff] px-2 py-1 text-[11px] font-semibold text-[#1e40af]"
                      >
                        <LockKeyhole className="h-3 w-3" /> Réserver
                      </button>
                    </div>
                  ) : null}

                  {form && form.fundId === fund.id ? (
                    <div className="mt-3 rounded-lg border border-[#ddd6c8] bg-[#fbf9f3] p-3">
                      {form.kind === "movement" ? (
                        <>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#57534e]">
                            {form.direction === "IN" ? "Encaissement" : "Décaissement"}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <NumberField
                              label="Montant"
                              value={Number(movementDraft.amount)}
                              onChange={(v) => setMovementDraft({ ...movementDraft, amount: String(v) })}
                              step={fund.currency === "XAF" || fund.currency === "XOF" ? 500 : 1}
                              suffix={fund.currency}
                            />
                            <TextField
                              label="Date valeur"
                              type="date"
                              value={movementDraft.valueDate}
                              onChange={(v) => setMovementDraft({ ...movementDraft, valueDate: v })}
                            />
                          </div>
                          <div className="mt-2">
                            <TextField
                              label="Description"
                              value={movementDraft.description}
                              onChange={(v) => setMovementDraft({ ...movementDraft, description: v })}
                              placeholder="Cotisations de la séance, frais, transfert…"
                            />
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={postMovement}
                              className="rounded-md bg-[#0d3d28] px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(null)}
                              className="rounded-md border border-[#ddd6c8] bg-white px-2.5 py-1.5 text-[11px] text-[#57534e]"
                            >
                              Annuler
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#57534e]">
                            Réservation
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <NumberField
                              label="Montant"
                              value={Number(reservationDraft.amount)}
                              onChange={(v) => setReservationDraft({ ...reservationDraft, amount: String(v) })}
                              step={fund.currency === "XAF" || fund.currency === "XOF" ? 500 : 1}
                              suffix={fund.currency}
                            />
                            <TextField
                              label="Expiration"
                              type="date"
                              value={reservationDraft.expiresAt}
                              onChange={(v) => setReservationDraft({ ...reservationDraft, expiresAt: v })}
                            />
                          </div>
                          <div className="mt-2">
                            <TextField
                              label="Motif"
                              value={reservationDraft.purpose}
                              onChange={(v) => setReservationDraft({ ...reservationDraft, purpose: v })}
                              placeholder="Aide décès, attribution tontine, garantie de prêt…"
                            />
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={postReservation}
                              className="rounded-md bg-[#0d3d28] px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                            >
                              Réserver
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(null)}
                              className="rounded-md border border-[#ddd6c8] bg-white px-2.5 py-1.5 text-[11px] text-[#57534e]"
                            >
                              Annuler
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  {activeReservations.length > 0 ? (
                    <div className="mt-3">
                      <p className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#6b7280]">
                        <CalendarClock className="h-3 w-3" /> Réservations actives
                      </p>
                      <div className="space-y-1.5">
                        {activeReservations.map((reservation) => (
                          <div
                            key={reservation.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#efe9dd] bg-[#fffdf9] px-2 py-1.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-medium text-[#3f3a33]">
                                {reservation.purpose}
                              </p>
                              <p className="text-[10px] text-[#8a8378]">
                                {formatMoney(reservation.amountMinor, reservation.currency)}
                                {reservation.expiresAt
                                  ? ` · expire le ${new Date(reservation.expiresAt).toLocaleDateString("fr-FR")}`
                                  : ""}
                              </p>
                            </div>
                            {canEdit ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => closeReservation(fund.id, reservation.id, "consume")}
                                  className="rounded border border-[#cce8d4] bg-[#f7fcf8] px-1.5 py-0.5 text-[10px] font-semibold text-[#166534]"
                                >
                                  Consommer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => closeReservation(fund.id, reservation.id, "release")}
                                  className="rounded border border-[#e4dfd5] bg-white px-1.5 py-0.5 text-[10px] text-[#57534e]"
                                >
                                  Libérer
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(fund.movements ?? []).length > 0 ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[10.5px] font-semibold uppercase tracking-wide text-[#6b7280]">
                        Derniers mouvements ({(fund.movements ?? []).length})
                      </summary>
                      <div className="mt-2 max-h-48 space-y-1 overflow-auto">
                        {(fund.movements ?? []).slice(0, 12).map((movement) => (
                          <div
                            key={movement.id}
                            className="flex items-center justify-between gap-2 border-b border-[#f2eee5] pb-1 text-[10.5px]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[#3f3a33]">{movement.description}</p>
                              <p className="text-[9.5px] text-[#a8a093]">
                                {new Date(movement.valueDate).toLocaleDateString("fr-FR")} ·{" "}
                                {movement.sourceType}
                              </p>
                            </div>
                            <span
                              className={`flex-shrink-0 font-semibold ${
                                movement.direction === "IN" ? "text-[#166534]" : "text-[#991b1b]"
                              }`}
                            >
                              {movement.direction === "IN" ? "+" : "−"}
                              {formatMoney(movement.amountMinor, fund.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <EmptyHint>
            Un mouvement sortant ne peut jamais dépasser le disponible après réservations.
            Une réservation consommée crée un décaissement lié ; une réservation libérée rend
            le montant au disponible sans toucher au solde. Les montants sont en unités
            mineures exactes (XAF : entier, EUR : centimes).
          </EmptyHint>
        </div>
      </SectionCard>
    </div>
  );
}
