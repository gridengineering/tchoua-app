"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Building2, CalendarClock, CalendarDays, Check, ChevronLeft,
  ChevronRight, Coins, FileText, Layers, Loader2, MapPin, Plus, Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FrequencyPicker } from "@/components/ui/frequency-picker";
import {
  FrequencyConfigV2, frequencyLabel, getNextSessions,
} from "@/lib/frequency";
import { formatCurrency } from "@/lib/utils";

type Regulation = { title: string; content: string };

const STEPS = [
  { num: 1, label: "Identité", icon: Building2 },
  { num: 2, label: "Contacts", icon: MapPin },
  { num: 3, label: "Activités", icon: Layers },
  { num: 4, label: "Réunions", icon: CalendarDays },
  { num: 5, label: "Tontine", icon: Coins },
  { num: 6, label: "Sessions & cycle", icon: CalendarClock },
  { num: 7, label: "Règlement", icon: FileText },
];

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const inputCls =
  "w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-[#165E39]/20 outline-none";
const labelCls = "mb-2 block text-sm font-bold text-gray-700";
const sectionTitle = "text-xl font-semibold text-charcoal mb-6";

export default function WizardCreationAssociation() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [parents, setParents] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "TONTINE_CLUB",
    color: "#165E39",
    logo: "",
    region: "",
    email: "",
    phone: "",
    website: "",
    parentId: "",
    parentSubscriptionFee: "",
  });

  const [meeting, setMeeting] = useState({
    frequency: "MONTHLY" as "MONTHLY" | "QUARTERLY",
    dayOfWeek: 6,
    hour: 15,
    quorumPercent: 60,
    collationRate: 3000,
    collationHostPayout: 150000,
  });

  const [modules, setModules] = useState({
    tontine: true,
    epargne: false,
    prets: false,
    solidarite: true,
    investissement: false,
  });

  const [tontine, setTontine] = useState({
    contributionAmount: "25000",
    distributionMode: "ROTATION",
    auctionMinBidPct: "5",
    auctionMinBidders: "2",
    partAmount: "",
    caisseLoanRate: "5",
  });

  const [cycle, setCycle] = useState({
    cycleMonths: "12",
    startDate: new Date().toISOString().slice(0, 10),
  });

  const [frequency, setFrequency] = useState<FrequencyConfigV2>({
    mode: "MONTHLY",
    every: 1,
    rule: { kind: "NTH_WEEKDAY", position: 1, weekday: 6 },
  });

  const [regulations, setRegulations] = useState<Regulation[]>([
    { title: "Article 1 : Adhésion", content: "Tout membre s'engage à respecter le présent règlement intérieur et à s'acquitter de ses cotisations." },
    { title: "Article 2 : Cotisations", content: "Les cotisations sont dues à chaque session. Tout retard entraîne une pénalité conformément aux barèmes de l'association." },
    { title: "Article 3 : Discipline", content: "Les absences non justifiées, retards et manquements sont sanctionnés par le bureau selon les montants fixés en assemblée." },
  ]);

  useEffect(() => {
    fetch("/api/associations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.associations) {
          setParents(data.associations.map((a: any) => ({ id: a.id, name: a.name })));
        }
      })
      .catch(() => {});
  }, []);

  const previewDates = useMemo(() => getNextSessions(frequency, 12), [frequency]);
  const selectedCount = Object.values(modules).filter(Boolean).length;

  const canNext = useMemo(() => {
    if (step === 1) return form.name.trim().length >= 3;
    if (step === 2) return form.email === "" || /.+@.+\..+/.test(form.email);
    if (step === 3) return selectedCount > 0;
    if (step === 4) return meeting.quorumPercent >= 0 && meeting.quorumPercent <= 100;
    if (step === 5) return !modules.tontine || Number(tontine.contributionAmount) > 0;
    if (step === 6) return Number(cycle.cycleMonths) > 0;
    return regulations.length > 0 && regulations.every((r) => r.title.trim() && r.content.trim());
  }, [step, form.name, form.email, selectedCount, meeting.quorumPercent, modules.tontine, tontine.contributionAmount, cycle.cycleMonths, regulations]);

  const buildActivities = () => {
    const list: any[] = [];
    const common = { frequencyConfig: frequency, contributionFrequency: "MONTHLY" };

    if (modules.tontine) {
      list.push({
        ...common,
        name: "Tontine principale",
        description: "Tontine principale de l'association",
        type: tontine.distributionMode === "AUCTION" ? "TONTINE_ENCHERES" : "TONTINE_ROTATIVE",
        participation: "MANDATORY",
        contributionAmount: Number(tontine.contributionAmount) || 0,
        distributionMode: tontine.distributionMode,
        auctionMinBidPct: tontine.distributionMode === "AUCTION" ? Number(tontine.auctionMinBidPct) : null,
        auctionMinBidders: tontine.distributionMode === "AUCTION" ? Number(tontine.auctionMinBidders) : null,
        partAmount: tontine.partAmount ? Number(tontine.partAmount) : null,
        caisseLoanRate: Number(tontine.caisseLoanRate) || null,
      });
    }
    if (modules.epargne) {
      list.push({ ...common, name: "Épargne & investissement", type: "EPARGNE", participation: "OPTIONAL", contributionAmount: null });
    }
    if (modules.prets) {
      list.push({
        ...common,
        name: "Caisse de prêts",
        type: "PRET",
        participation: "OPTIONAL",
        contributionAmount: null,
        loanRate1: 2,
        loanRate2: 4,
        loanApprovalMode: "BUREAU",
      });
    }
    if (modules.solidarite) {
      list.push({
        ...common,
        name: "Caisse de solidarité",
        type: "AIDE_SOLIDAIRE",
        participation: "MANDATORY",
        contributionAmount: null,
      });
    }
    if (modules.investissement) {
      list.push({ ...common, name: "Investissement collectif", type: "INVESTISSEMENT", participation: "OPTIONAL", contributionAmount: null });
    }
    return list;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        parentSubscriptionFee: form.parentSubscriptionFee || null,
        meetingConfig: {
          ...meeting,
          cycleMonths: Number(cycle.cycleMonths),
          startDate: cycle.startDate,
        },
        activities: buildActivities(),
        regulations,
      };
      const res = await fetch("/api/associations/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.association) {
        router.push(`/associations/${data.association.id}`);
      } else {
        throw new Error(data.error || "Une erreur est survenue");
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const addRegulation = () =>
    setRegulations((prev) => [...prev, { title: `Article ${prev.length + 1}`, content: "" }]);
  const updateRegulation = (index: number, field: keyof Regulation, value: string) =>
    setRegulations((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  const removeRegulation = (index: number) =>
    setRegulations((prev) => prev.filter((_, i) => i !== index));

  return (
    <DashboardLayout title="Créer une association">
      <div className="max-w-4xl mx-auto py-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-charcoal mb-2">Créer une association</h1>
          <p className="text-graphite font-medium">
            Assistant en 7 étapes — tout reste modifiable ensuite dans les paramètres.
          </p>
        </div>

        <div className="mb-10 overflow-x-auto pb-2">
          <div className="flex min-w-[720px] items-center justify-between relative">
            <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2" />
            <div
              className="absolute top-6 left-0 h-1 bg-[#165E39] -z-10 -translate-y-1/2 transition-all duration-300"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-cream px-1">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-black transition-all ${
                    step === s.num
                      ? "bg-[#165E39] text-white shadow-lg ring-4 ring-[#165E39]/20"
                      : step > s.num
                      ? "bg-forest text-white"
                      : "bg-warm-white border-2 border-gray-200 text-ash"
                  }`}
                >
                  {step > s.num ? <Check className="h-6 w-6" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={`text-[11px] font-bold ${step >= s.num ? "text-gray-900" : "text-ash"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-error/10 p-4 font-bold text-red-600">{error}</div>
        )}

        <div className="min-h-[420px] rounded-3xl border border-stone bg-warm-white p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={sectionTitle}>Identité de l&apos;association</h2>
              <div>
                <label className={labelCls}>Nom de l&apos;association *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Ex : Tontine des Anciens"
                />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} min-h-[100px]`}
                  placeholder="But et objectifs de l'association…"
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputCls}
                  >
                    <option value="TONTINE_CLUB">Club de tontine</option>
                    <option value="COOPERATIVE">Coopérative</option>
                    <option value="SOLIDARITY">Fonds de solidarité</option>
                    <option value="INVESTMENT">Club d&apos;investissement</option>
                    <option value="MUTUAL">Mutuelle</option>
                    <option value="AGRICULTURAL">Coopérative agricole</option>
                    <option value="AMICALE">Amicale d&apos;élites / association de ressortissants</option>
                    <option value="SECTION">Section / démembrement d&apos;une association mère</option>
                    <option value="FEDERATION">Fédération / union d&apos;associations</option>
                    <option value="CULTURAL">Association culturelle</option>
                    <option value="PROFESSIONAL">Association professionnelle</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Couleur du thème</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-12 w-12 cursor-pointer rounded-xl"
                    />
                    <input value={form.color} readOnly className={`${inputCls} font-mono text-sm`} />
                  </div>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Association parente (optionnel)</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Aucune — association indépendante</option>
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {form.parentId && (
                  <div>
                    <label className={labelCls}>Frais de souscription au parent (FCFA)</label>
                    <input
                      type="number"
                      value={form.parentSubscriptionFee}
                      onChange={(e) => setForm({ ...form, parentSubscriptionFee: e.target.value })}
                      className={inputCls}
                      placeholder="Ex : 5 000"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={sectionTitle}>Contacts & localisation</h2>
              <div>
                <label className={labelCls}>Région / ville</label>
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={inputCls}
                  placeholder="Ex : Douala, Cameroun"
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Email de contact</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                    placeholder="contact@association.com"
                  />
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                    placeholder="+237 XXX XX XX XX"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Site web (optionnel)</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className={inputCls}
                  placeholder="https://…"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={sectionTitle}>Activités à activer</h2>
              <p className="text-sm text-graphite">
                Chaque module peut être configuré plus finement après la création. Les cotisations
                par défaut sont modifiables à tout moment.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "tontine", title: "Tontine", desc: "Cotisations et distribution des cagnottes" },
                  { key: "epargne", title: "Épargne", desc: "Dépôts libres et capitalisation" },
                  { key: "prets", title: "Prêts", desc: "Caisse de crédit avec échéancier" },
                  { key: "solidarite", title: "Solidarité", desc: "Aides maladie, décès, naissance…" },
                  { key: "investissement", title: "Investissement", desc: "Projets collectifs et dividendes" },
                ].map((m) => (
                  <label
                    key={m.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      (modules as any)[m.key]
                        ? "border-forest bg-forest/5"
                        : "border-stone bg-white hover:border-forest/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(modules as any)[m.key]}
                      onChange={(e) => setModules({ ...modules, [m.key]: e.target.checked })}
                      className="mt-1 h-4 w-4 accent-forest"
                    />
                    <div>
                      <div className="font-semibold text-charcoal">{m.title}</div>
                      <div className="text-xs text-ash">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedCount === 0 && (
                <p className="text-sm font-medium text-error">Sélectionnez au moins une activité.</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={sectionTitle}>Organisation des réunions</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Fréquence</label>
                  <select
                    value={meeting.frequency}
                    onChange={(e) => setMeeting({ ...meeting, frequency: e.target.value as any })}
                    className={inputCls}
                  >
                    <option value="MONTHLY">Mensuelle</option>
                    <option value="QUARTERLY">Trimestrielle</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Jour</label>
                  <select
                    value={meeting.dayOfWeek}
                    onChange={(e) => setMeeting({ ...meeting, dayOfWeek: Number(e.target.value) })}
                    className={inputCls}
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Heure</label>
                  <input
                    type="number"
                    min={6}
                    max={22}
                    value={meeting.hour}
                    onChange={(e) => setMeeting({ ...meeting, hour: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Quorum requis (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={meeting.quorumPercent}
                    onChange={(e) => setMeeting({ ...meeting, quorumPercent: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Collation par membre (FCFA)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={meeting.collationRate}
                    onChange={(e) => setMeeting({ ...meeting, collationRate: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Forfait reversé à l&apos;hôte (FCFA)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={meeting.collationHostPayout}
                    onChange={(e) => setMeeting({ ...meeting, collationHostPayout: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={sectionTitle}>Paramètres de la tontine</h2>
              {!modules.tontine ? (
                <p className="rounded-xl bg-cream p-4 text-sm text-graphite">
                  La tontine n&apos;est pas activée. Vous pourrez l&apos;ajouter plus tard depuis les
                  activités de l&apos;association.
                </p>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Cotisation par session (FCFA) *</label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={tontine.contributionAmount}
                        onChange={(e) => setTontine({ ...tontine, contributionAmount: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Mode d&apos;attribution</label>
                      <select
                        value={tontine.distributionMode}
                        onChange={(e) => setTontine({ ...tontine, distributionMode: e.target.value })}
                        className={inputCls}
                      >
                        <option value="ROTATION">Rotation (ordre figé)</option>
                        <option value="LOTTERY_MONTHLY">Tirage mensuel</option>
                        <option value="LOTTERY_UNIQUE">Tirage unique</option>
                        <option value="AUCTION">Enchères</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Montant d&apos;une part (optionnel)</label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={tontine.partAmount}
                        onChange={(e) => setTontine({ ...tontine, partAmount: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Taux de la caisse de prêts (%)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={tontine.caisseLoanRate}
                        onChange={(e) => setTontine({ ...tontine, caisseLoanRate: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  {tontine.distributionMode === "AUCTION" && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Mise à prix minimum (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={tontine.auctionMinBidPct}
                          onChange={(e) => setTontine({ ...tontine, auctionMinBidPct: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Enchérisseurs minimum</label>
                        <input
                          type="number"
                          min={1}
                          value={tontine.auctionMinBidders}
                          onChange={(e) => setTontine({ ...tontine, auctionMinBidders: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={sectionTitle}>Sessions & cycle</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Durée du cycle (mois)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={cycle.cycleMonths}
                    onChange={(e) => setCycle({ ...cycle, cycleMonths: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date de première session</label>
                  <input
                    type="date"
                    value={cycle.startDate}
                    onChange={(e) => setCycle({ ...cycle, startDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-stone bg-cream/40 p-4">
                <div className="mb-3 text-sm font-semibold text-charcoal">Fréquence des sessions</div>
                <FrequencyPicker value={frequency} onChange={setFrequency} />
              </div>
              <div className="rounded-xl bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ash">
                    Aperçu — 12 prochaines sessions
                  </span>
                  <span className="text-xs font-medium text-forest">{frequencyLabel(frequency)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {previewDates.map((d, i) => (
                    <span key={i} className="rounded-lg bg-forest/5 px-2 py-1 text-xs font-medium text-forest">
                      {d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h2 className={sectionTitle}>Règlement intérieur</h2>
                <button
                  type="button"
                  onClick={addRegulation}
                  className="flex items-center gap-2 rounded-lg bg-[#165E39]/10 px-4 py-2 text-sm font-bold text-[#165E39] hover:bg-[#165E39]/20"
                >
                  <Plus className="h-4 w-4" /> Ajouter un article
                </button>
              </div>
              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
                {regulations.map((reg, index) => (
                  <div key={index} className="relative rounded-2xl border border-gray-200 bg-cream p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        value={reg.title}
                        onChange={(e) => updateRegulation(index, "title", e.target.value)}
                        className="w-full border-none bg-transparent p-0 font-semibold text-charcoal outline-none"
                        placeholder="Titre de l'article"
                      />
                      {regulations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRegulation(index)}
                          className="text-red-400 hover:text-red-600"
                          aria-label="Supprimer l'article"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={reg.content}
                      onChange={(e) => updateRegulation(index, "content", e.target.value)}
                      className="min-h-[70px] w-full rounded-xl border border-gray-200 bg-warm-white px-4 py-3 font-medium outline-none"
                      placeholder="Contenu des règles…"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-forest/20 bg-forest/5 p-4 text-sm">
                <div className="mb-2 font-bold text-forest">Récapitulatif</div>
                <div className="grid gap-1 text-charcoal sm:grid-cols-2">
                  <div>Nom : {form.name || "—"}</div>
                  <div>Type : {form.type}</div>
                  <div>Région : {form.region || "—"}</div>
                  <div>Activités : {selectedCount}</div>
                  <div>Réunions : {meeting.frequency === "MONTHLY" ? "mensuelles" : "trimestrielles"}</div>
                  <div>Cycle : {cycle.cycleMonths} mois</div>
                  <div>Cotisation tontine : {modules.tontine ? formatCurrency(Number(tontine.contributionAmount) || 0) : "—"}</div>
                  <div>Articles du RI : {regulations.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1 || isSubmitting}
            className="flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" /> Précédent
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex items-center gap-2 rounded-xl bg-[#165E39] px-8 py-3 font-black text-white shadow-md transition-all hover:bg-[#0F3F26] disabled:opacity-50"
            >
              Suivant <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canNext}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-black text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Terminer et créer"}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
