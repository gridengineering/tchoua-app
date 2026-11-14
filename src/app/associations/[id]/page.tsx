"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Users, Calendar, DollarSign, FileText, MessageSquare,
  Activity, Settings, UserPlus, Plus, Search, Upload, Send,
  AlertCircle, CheckCircle, Clock, ChevronRight, X, Building2,
  BarChart3, Shield, ShieldCheck, Gavel, Shuffle, Star, Heart, Boxes
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getInitials, getFrequencyLabel } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { RegulationApprovalModal } from "@/components/association/RegulationApprovalModal";
import { KycBadge } from "@/components/kyc/kyc-badge";
import { TrustBadge } from "@/components/association/trust-badge";
import LifecycleBadge from "@/components/association/LifecycleBadge";
import RelationsPanel from "@/components/association/RelationsPanel";
import ElectionPanel from "@/components/association/ElectionPanel";
import WorkflowPanel from "@/components/association/WorkflowPanel";
import ReportsPanel from "@/components/association/ReportsPanel";
import NotificationsBell from "@/components/association/NotificationsBell";

// ─── Local types ───────────────────────────────────────────────────────────────
type AssocDetail = {
  id: string;
  name: string;
  description?: string;
  type: string;
  color: string;
  status: string;
  region?: string;
  bureauConfig?: string;
  socialAidCaps?: string;
  sanctionsConfig?: string;
  memberships?: AssocMember[];
  activities?: AssocActivity[];
  parent?: { id: string; name: string } | null;
  minKycLevel?: number | null;
  requireRegulationApproval?: boolean | null;
  trustScore?: number | null;
  trustLevel?: number | null;
};

type AssocActivity = {
  id: string;
  name: string;
  type: string;
  participation: string;
  contributionAmount?: number;
  contributionFrequency: string;
  distributionMode: string;
  mySubscription?: { id: string; parts?: number } | null;
  subscriptions?: { id: string }[];
  caisseBalance: number;
};

type AssocMember = {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt?: string;
  reliabilityScore: number;
  customRoleId?: string | null;
  customRole?: { id: string; name: string; color: string } | null;
  user: {
    name: string;
    email: string;
    kycLevel?: number | null;
    kycStatus?: string | null;
    kycRequests?: Array<{ id: string; requestedLevel: number; createdAt: string }>;
  };
};

type CustomRoleLite = { id: string; name: string; color: string };

type AssocMeetingT = {
  id: string;
  title?: string;
  type: string;
  scheduledAt: string;
  location?: string;
  status: string;
  quorumReached: boolean;
  attendeeCount?: number;
};

type AssocDocument = {
  id: string;
  name: string;
  type: string;
  url?: string;
  createdAt: string;
  uploadedBy?: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  channel: string;
};

type FinanceReport = {
  activityId: string;
  activityName: string;
  caisseBalance: number;
  totalCollected: number;
  expectedMonthly: number;
  recentContributions: {
    id: string;
    memberName: string;
    activityName: string;
    amount: number;
    date: string;
    status: string;
  }[];
};

// ─── Mock data helpers ─────────────────────────────────────────────────────────
function mockAssoc(id: string): AssocDetail {
  return {
    id,
    name: "Association Solidarité Afrique",
    description: "Association dédiée à la solidarité et au développement économique des membres.",
    type: "SOLIDARITY",
    color: "#0d3d28",
    status: "ACTIVE",
    region: "Centre",
    bureauConfig: JSON.stringify({ hasPresident: true, hasTreasurer: true, hasSecretary: true }),
    socialAidCaps: JSON.stringify([
      { category: "SANTE", label: "Santé", cap: 500000 },
      { category: "EDUCATION", label: "Éducation", cap: 300000 },
      { category: "DECES", label: "Décès", cap: 1000000 },
      { category: "MARIAGE", label: "Mariage", cap: 200000 },
    ]),
    sanctionsConfig: JSON.stringify({ absenceAmende: 5000, retardAmende: 2500 }),
    memberships: mockMembers(),
    activities: mockActivities(),
  };
}

function mockMembers(): AssocMember[] {
  return [
    { id: "m1", userId: "u1", role: "PRESIDENT", status: "ACTIVE", joinedAt: "2023-01-15", reliabilityScore: 97, user: { name: "Jean-Pierre Nkomo", email: "jp@example.com" } },
    { id: "m2", userId: "u2", role: "TREASURER", status: "ACTIVE", joinedAt: "2023-01-15", reliabilityScore: 92, user: { name: "Marie Fouda", email: "mf@example.com" } },
    { id: "m3", userId: "u3", role: "SECRETARY", status: "ACTIVE", joinedAt: "2023-02-01", reliabilityScore: 88, user: { name: "Paul Essama", email: "pe@example.com" } },
    { id: "m4", userId: "u4", role: "MEMBER", status: "ACTIVE", joinedAt: "2023-03-10", reliabilityScore: 75, user: { name: "Carine Mballa", email: "cm@example.com" } },
    { id: "m5", userId: "u5", role: "MEMBER", status: "ACTIVE", joinedAt: "2023-04-05", reliabilityScore: 45, user: { name: "Thomas Biya", email: "tb@example.com" } },
    { id: "m6", userId: "u6", role: "MEMBER", status: "SUSPENDED", joinedAt: "2023-05-20", reliabilityScore: 20, user: { name: "Sylvie Atangana", email: "sa@example.com" } },
  ];
}

function mockActivities(): AssocActivity[] {
  return [
    { id: "a1", name: "Tontine Mensuelle", type: "TONTINE", participation: "MANDATORY", contributionAmount: 25000, contributionFrequency: "MONTHLY", distributionMode: "ROTATION", mySubscription: { id: "sub1", parts: 1 }, subscriptions: [{ id: "sub1" }, { id: "sub2" }, { id: "sub3" }], caisseBalance: 375000 },
    { id: "a2", name: "Fonds de Solidarité", type: "SOLIDARITY", participation: "MANDATORY", contributionAmount: 5000, contributionFrequency: "MONTHLY", distributionMode: "NEED", mySubscription: { id: "sub2", parts: 1 }, subscriptions: [{ id: "sub1" }, { id: "sub2" }], caisseBalance: 120000 },
    { id: "a3", name: "Épargne Collective", type: "SAVINGS", participation: "OPTIONAL", contributionAmount: 15000, contributionFrequency: "MONTHLY", distributionMode: "MERIT", mySubscription: null, subscriptions: [{ id: "sub1" }], caisseBalance: 45000 },
    { id: "a4", name: "Vente aux Enchères", type: "AUCTION", participation: "CONDITIONAL", contributionAmount: 10000, contributionFrequency: "QUARTERLY", distributionMode: "AUCTION", mySubscription: { id: "sub4", parts: 2 }, subscriptions: [{ id: "sub1" }, { id: "sub2" }, { id: "sub3" }, { id: "sub4" }], caisseBalance: 80000 },
  ];
}

function mockMeetings(): AssocMeetingT[] {
  return [
    { id: "mt1", title: "Assemblée Générale Ordinaire", type: "GENERAL", scheduledAt: "2026-05-15T14:00:00", location: "Salle communautaire, Yaoundé", status: "UPCOMING", quorumReached: false, attendeeCount: 0 },
    { id: "mt2", title: "Réunion de Bureau", type: "BUREAU", scheduledAt: "2026-05-08T10:00:00", location: "Chez le Président", status: "UPCOMING", quorumReached: false, attendeeCount: 0 },
    { id: "mt3", title: "Assemblée Extraordinaire", type: "EXTRAORDINARY", scheduledAt: "2026-04-20T15:00:00", location: "Salle communautaire, Yaoundé", status: "DONE", quorumReached: true, attendeeCount: 18 },
    { id: "mt4", title: "Réunion Ordinaire Avril", type: "GENERAL", scheduledAt: "2026-04-05T14:00:00", location: "École de quartier", status: "DONE", quorumReached: true, attendeeCount: 22 },
  ];
}

function mockDocuments(): AssocDocument[] {
  return [
    { id: "d1", name: "Règlement Intérieur 2025", type: "REGLEMENT", url: "#", createdAt: "2025-01-01", uploadedBy: "Jean-Pierre Nkomo" },
    { id: "d2", name: "PV Assemblée Avril 2026", type: "PV", url: "#", createdAt: "2026-04-20", uploadedBy: "Paul Essama" },
    { id: "d3", name: "Rapport Financier T1 2026", type: "RAPPORT", url: "#", createdAt: "2026-04-01", uploadedBy: "Marie Fouda" },
    { id: "d4", name: "Statuts Association", type: "STATUTS", url: "#", createdAt: "2023-01-01", uploadedBy: "Jean-Pierre Nkomo" },
  ];
}

function mockMessages(channel: string): ChatMessage[] {
  const base: ChatMessage[] = [
    { id: "msg1", senderId: "u1", senderName: "Jean-Pierre Nkomo", content: "Bonjour à tous ! La prochaine réunion est confirmée pour le 15 mai.", createdAt: "2026-05-04T09:00:00", channel: "GENERAL" },
    { id: "msg2", senderId: "u2", senderName: "Marie Fouda", content: "Merci pour l'information. Les cotisations du mois d'avril ont bien été enregistrées.", createdAt: "2026-05-04T09:15:00", channel: "GENERAL" },
    { id: "msg3", senderId: "u4", senderName: "Carine Mballa", content: "Est-ce que quelqu'un peut m'aider pour le calcul des parts ce mois ?", createdAt: "2026-05-04T10:30:00", channel: "GENERAL" },
    { id: "msg4", senderId: "u1", senderName: "Jean-Pierre Nkomo", content: "Budget bureau validé. Réunion de bureau le 8 mai à 10h.", createdAt: "2026-05-03T16:00:00", channel: "BUREAU" },
    { id: "msg5", senderId: "u2", senderName: "Marie Fouda", content: "Les comptes du mois sont disponibles pour vérification.", createdAt: "2026-05-03T16:30:00", channel: "BUREAU" },
    { id: "msg6", senderId: "u1", senderName: "Jean-Pierre Nkomo", content: "ANNONCE: Cotisations dues avant le 10 mai. Merci de votre ponctualité.", createdAt: "2026-05-01T08:00:00", channel: "ANNONCES" },
  ];
  return base.filter(m => m.channel === channel);
}

function mockFinances(): FinanceReport {
  return {
    activityId: "all",
    activityName: "Toutes activités",
    caisseBalance: 620000,
    totalCollected: 1250000,
    expectedMonthly: 270000,
    recentContributions: [
      { id: "c1", memberName: "Jean-Pierre Nkomo", activityName: "Tontine Mensuelle", amount: 25000, date: "2026-05-01", status: "PAID" },
      { id: "c2", memberName: "Marie Fouda", activityName: "Tontine Mensuelle", amount: 25000, date: "2026-05-01", status: "PAID" },
      { id: "c3", memberName: "Paul Essama", activityName: "Fonds de Solidarité", amount: 5000, date: "2026-05-02", status: "PAID" },
      { id: "c4", memberName: "Thomas Biya", activityName: "Tontine Mensuelle", amount: 25000, date: "2026-05-03", status: "LATE" },
      { id: "c5", memberName: "Carine Mballa", activityName: "Épargne Collective", amount: 15000, date: "2026-04-30", status: "PAID" },
    ],
  };
}

// ─── Utility helpers ───────────────────────────────────────────────────────────
function getAssocTypeLabel(type: string): string {
  const types: Record<string, string> = {
    SOLIDARITY: "Solidarité",
    CULTURAL: "Culturelle",
    PROFESSIONAL: "Professionnelle",
    RELIGIOUS: "Religieuse",
    SPORTS: "Sportive",
    SAVINGS: "Épargne",
    MIXED: "Mixte",
    AMICALE: "Amicale",
    SECTION: "Section",
    FEDERATION: "Fédération",
    TONTINE_CLUB: "Club de tontine",
    COOPERATIVE: "Coopérative",
    INVESTMENT: "Investissement",
    AGRICULTURAL: "Agricole",
    MUTUAL: "Mutuelle",
  };
  return types[type] || type;
}

function getActivityTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    TONTINE: "🔄", SAVINGS: "💰", SOLIDARITY: "🤝", AUCTION: "🔨",
    INSURANCE: "🛡️", LOAN: "💳", INVESTMENT: "📈", OTHER: "📦",
  };
  return icons[type] || "📦";
}

function getDistributionLabel(mode: string): string {
  const labels: Record<string, string> = {
    ROTATION: "Rotation", LOTTERY: "Loterie", AUCTION: "Enchère",
    MERIT: "Mérite", NEED: "Besoin",
  };
  return labels[mode] || mode;
}

function getDistributionIcon(mode: string) {
  switch (mode) {
    case "ROTATION": return <RotateCcwIcon />;
    case "LOTTERY": return <ShuffleIcon />;
    case "AUCTION": return <GavelIcon />;
    case "MERIT": return <StarIcon />;
    case "NEED": return <HeartIcon />;
    default: return null;
  }
}

function RotateCcwIcon() { return <span className="text-xs">🔄</span>; }
function ShuffleIcon() { return <span className="text-xs">🎲</span>; }
function GavelIcon() { return <span className="text-xs">🔨</span>; }
function StarIcon() { return <span className="text-xs">⭐</span>; }
function HeartIcon() { return <span className="text-xs">❤️</span>; }

function getAidCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    SANTE: "Santé", DECES: "Décès", NAISSANCE: "Naissance", MARIAGE: "Mariage",
    SCOLARITE: "Scolarité", SINISTRE: "Sinistre", AUTRE: "Autre",
  };
  return labels[category] ?? category;
}

function getRoleLabel(role: string): string {
  const roles: Record<string, string> = {
    PRESIDENT: "Président", TREASURER: "Trésorier", SECRETARY: "Secrétaire",
    VICE_PRESIDENT: "Vice-Président", AUDITOR: "Commissaire aux Comptes", MEMBER: "Membre",
  };
  return roles[role] || role;
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "PRESIDENT": return "bg-amber-100 text-amber-800";
    case "TREASURER": return "bg-green-100 text-green-800";
    case "SECRETARY": return "bg-info/10 text-blue-800";
    case "VICE_PRESIDENT": return "bg-purple-100 text-purple-800";
    case "AUDITOR": return "bg-indigo-100 text-indigo-800";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getReliabilityColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-orange-400";
  return "bg-error";
}

function isBureau(role: string): boolean {
  return ["PRESIDENT", "TREASURER", "SECRETARY", "VICE_PRESIDENT", "AUDITOR"].includes(role);
}

function getMeetingTypeLabel(type: string): string {
  const t: Record<string, string> = {
    GENERAL: "AGO", BUREAU: "Bureau", EXTRAORDINARY: "AGE", THEMATIC: "Thématique",
  };
  return t[type] || type;
}

function getDocTypeLabel(type: string): string {
  const t: Record<string, string> = {
    REGLEMENT: "Règlement", PV: "Procès-verbal", RAPPORT: "Rapport",
    STATUTS: "Statuts", CONTRAT: "Contrat", AUTRE: "Autre",
  };
  return t[type] || type;
}

// ─── Modal components ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-warm-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-graphite" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
type TabKey = "overview" | "activities" | "members" | "meetings" | "finances" | "documents" | "chat" | "governance" | "relations" | "reports";

export default function AssociationDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const router = useRouter();
  const { t: _t } = useI18n();

  // Data states
  const [assoc, setAssoc] = useState<AssocDetail | null>(null);
  const [members, setMembers] = useState<AssocMember[]>([]);
  const [activities, setActivities] = useState<AssocActivity[]>([]);
  const [meetings, setMeetings] = useState<AssocMeetingT[]>([]);
  const [finances, setFinances] = useState<FinanceReport | null>(null);
  const [documents, setDocuments] = useState<AssocDocument[]>([]);
  const [socialAids, setSocialAids] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as TabKey;
  const [tab, setTab] = useState<TabKey>(
    initialTab &&
      [
        "overview",
        "activities",
        "members",
        "meetings",
        "finances",
        "documents",
        "chat",
        "governance",
        "relations",
        "reports",
      ].includes(initialTab)
      ? initialTab
      : "overview"
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");
  const [memberStatusFilter, setMemberStatusFilter] = useState("ALL");
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [chatChannel, setChatChannel] = useState("GENERAL");
  const [chatInput, setChatInput] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<AssocMeetingT | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<AssocActivity | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [modalSubscribe, setModalSubscribe] = useState<AssocActivity | null>(null);
  const [modalMeeting, setModalMeeting] = useState(false);
  const [modalDocument, setModalDocument] = useState(false);
  const [modalBank, setModalBank] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalCotisation, setModalCotisation] = useState(false);
  const [modalSocialAid, setModalSocialAid] = useState(false);
  const [editingMemberRole, setEditingMemberRole] = useState<AssocMember | null>(null);
  const [customRoles, setCustomRoles] = useState<CustomRoleLite[]>([]);
  const [showRegulationModal, setShowRegulationModal] = useState(false);
  const [myMembershipStatus, setMyMembershipStatus] = useState<string | null>(null);
  const [eligibilityNotice, setEligibilityNotice] = useState<string | null>(null);
  const [myKycLevel, setMyKycLevel] = useState<number | null>(null);

  const reloadMembers = async () => {
    const r = await fetch(`/api/associations/${id}/members`);
    if (r.ok) {
      const d = await r.json();
      setMembers(d.members ?? []);
    }
  };
  const reloadCustomRoles = async () => {
    const r = await fetch(`/api/associations/${id}/roles`);
    if (r.ok) {
      const d = await r.json();
      setCustomRoles(d.roles ?? []);
    }
  };
  useEffect(() => { if (id) reloadCustomRoles(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Form states
  const [subscribeForm, setSubscribeForm] = useState({ parts: 1 });
  const [meetingForm, setMeetingForm] = useState({ date: "", time: "", location: "", type: "GENERAL", quorum: 50, agenda: "" });
  const [docForm, setDocForm] = useState({ name: "", type: "PV" });
  const [cotisationForm, setCotisationForm] = useState({ memberId: "", amount: "", paymentMode: "MTN_MOMO", reference: "" });
  const [socialAidForm, setSocialAidForm] = useState({ category: "SANTE", amount: "", justification: "" });
  const [bankForm, setBankForm] = useState({ label: "", type: "BANK", bankName: "", accountNumber: "", mobileNumber: "", mobileOperator: "MTN", isDefault: false });

  // Derived
  const { data: session } = useSession();
  const myUserId = (session?.user as { id?: string } | undefined)?.id;
  const myMembership = myUserId ? members.find(m => m.userId === myUserId) : undefined;
  const myRole = myMembership?.role ?? "MEMBER";
  const isBureauMember = isBureau(myRole);

  // Load data
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchAll = async () => {
      try {
        // Fetch association details
        const assocRes = await fetch(`/api/associations/${id}`);
        const assocData = assocRes.ok ? await assocRes.json() : null;
        setAssoc(assocData?.association ?? null);

        // Fetch members
        const membersRes = await fetch(`/api/associations/${id}/members`);
        const membersData = membersRes.ok ? await membersRes.json() : null;
        setMembers(membersData?.members ?? []);

        // Fetch activities
        const actRes = await fetch(`/api/associations/${id}/activities`);
        const actData = actRes.ok ? await actRes.json() : null;
        setActivities(actData?.activities ?? []);

        // Fetch meetings
        const meetRes = await fetch(`/api/associations/${id}/meetings`);
        const meetData = meetRes.ok ? await meetRes.json() : null;
        setMeetings(meetData?.meetings ?? []);

        // Fetch finances
        const finRes = await fetch(`/api/associations/${id}/reports?type=ACTIVITY`);
        const finData = finRes.ok ? await finRes.json() : null;
        setFinances(finData?.report ?? null);

        // Fetch documents
        const docRes = await fetch(`/api/associations/${id}/documents`);
        const docData = docRes.ok ? await docRes.json() : null;
        setDocuments(docData?.documents ?? []);

        const aidsRes = await fetch(`/api/associations/${id}/social-aids`);
        const aidsData = aidsRes.ok ? await aidsRes.json() : null;
        setSocialAids(aidsData?.requests ?? []);

        const bankRes = await fetch(`/api/associations/${id}/bank-accounts`);
        const bankData = bankRes.ok ? await bankRes.json() : null;
        setBankAccounts(bankData?.accounts ?? []);

      } catch {
        setError("Impossible de charger les données de l'association.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  // Check regulation approval need after load
  useEffect(() => {
    if (!id || !members.length) return;
    // Fetch my membership status via regulations endpoint
    fetch(`/api/associations/${id}/regulations`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.required !== false && data.articles?.length > 0 && !data.allApproved) {
          setMyMembershipStatus(data.membershipStatus ?? "PENDING");
          setShowRegulationModal(true);
        }
      })
      .catch(() => {});
  }, [id, members.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/kyc", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setMyKycLevel(data.level); })
      .catch(() => {});
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (!id) return;
    fetch(`/api/associations/${id}/messages?channel=${chatChannel}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setMessages(data?.messages ?? []);
      })
      .catch(() => {
        setMessages(mockMessages(chatChannel));
      });
  }, [id, chatChannel]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      senderName: myMembership?.user.name ?? "Moi",
      content: chatInput.trim(),
      createdAt: new Date().toISOString(),
      channel: chatChannel,
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput("");
    // Fire API (fire-and-forget)
    fetch(`/api/associations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: chatChannel, content: chatInput.trim() }),
    }).catch(() => {});
  };

  const socialAidCaps = assoc?.socialAidCaps ? JSON.parse(assoc.socialAidCaps) as { category: string; label: string; cap: number }[] : [];

  const upcomingMeeting = meetings.find(m => m.status === "UPCOMING");
  const myActivities = activities.filter(a => a.mySubscription);
  const availableActivities = activities.filter(a => a.participation === "OPTIONAL" && !a.mySubscription);

  const filteredMembers = members.filter(m => {
    const matchSearch = m.user.name.toLowerCase().includes(memberSearch.toLowerCase());
    const matchRole = memberRoleFilter === "ALL" || m.role === memberRoleFilter;
    const matchStatus = memberStatusFilter === "ALL" || m.status === memberStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredDocuments = documents.filter(d => docTypeFilter === "ALL" || d.type === docTypeFilter);

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { key: "activities", label: "Activités", icon: Activity },
    { key: "members", label: `Membres (${members.length})`, icon: Users },
    { key: "meetings", label: "Réunions", icon: Calendar },
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "chat", label: "Chat", icon: MessageSquare },
    { key: "governance", label: "Gouvernance", icon: Gavel },
    { key: "relations", label: "Relations", icon: Shuffle },
    { key: "reports", label: "Rapports", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full" style={{ borderColor: "#0d3d28", borderTopColor: "transparent" }} />
            <p className="text-sm text-graphite">Chargement de l&apos;association...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assoc) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">{error ?? "Association introuvable"}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/associations")}>
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!assoc) {
    return (
      <DashboardLayout title="Association">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Association indisponible</h2>
          <p className="mt-1 text-sm text-slate-500">
            {error ?? "Vous n'êtes pas membre de cette association ou elle n'existe plus."}
          </p>
          <Link href="/associations" className="mt-5 inline-flex rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">
            Retour à mes associations
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const decideAid = async (requestId: string, action: "APPROVE" | "REJECT") => {
    const res = await fetch(`/api/associations/${id}/social-aids`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (res.ok) {
      const r = await fetch(`/api/associations/${id}/social-aids`);
      if (r.ok) setSocialAids((await r.json()).requests ?? []);
    }
  };

  const addBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/associations/${id}/bank-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bankForm),
    });
    if (res.ok) {
      const r = await fetch(`/api/associations/${id}/bank-accounts`);
      if (r.ok) setBankAccounts((await r.json()).accounts ?? []);
      setModalBank(false);
      setBankForm({ label: "", type: "BANK", bankName: "", accountNumber: "", mobileNumber: "", mobileOperator: "MTN", isDefault: false });
    }
  };

  const reviewKyc = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    const note = decision === "REJECT" ? window.prompt("Motif du refus (optionnel)") ?? undefined : undefined;
    const res = await fetch("/api/kyc/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, decision, note }),
    });
    if (res.ok) await reloadMembers();
    else {
      const data = await res.json().catch(() => ({}));
      setEligibilityNotice(data.error ?? "Validation KYC impossible");
    }
  };

  const removeBankAccount = async (accountId: string) => {
    const res = await fetch(`/api/associations/${id}/bank-accounts?accountId=${accountId}`, { method: "DELETE" });
    if (res.ok) setBankAccounts((prev) => prev.filter((a) => a.id !== accountId));
  };

  const uploadDocument = async () => {
    if (!docFile) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", docFile);
    form.append("name", docForm.name || docFile.name);
    form.append("type", docForm.type);
    const res = await fetch(`/api/associations/${id}/documents`, { method: "POST", body: form });
    if (res.ok) {
      const r = await fetch(`/api/associations/${id}/documents`);
      if (r.ok) setDocuments((await r.json()).documents ?? []);
      setModalDocument(false);
      setDocFile(null);
      setDocForm({ name: "", type: "PV" });
    }
    setUploading(false);
  };

  return (
    <DashboardLayout title={assoc.name}>
      {/* Regulation Approval Modal (bloquant pour les nouveaux membres) */}
      {showRegulationModal && (
        <RegulationApprovalModal
          associationId={id}
          associationName={assoc.name}
          onAllApproved={() => {
            setShowRegulationModal(false);
            setMyMembershipStatus("ACTIVE");
          }}
        />
      )}
      <div className="space-y-6 pb-10">

        {/* Breadcrumb */}
        <Link href="/associations" className="inline-flex items-center gap-2 text-sm text-graphite hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux associations
        </Link>

        {eligibilityNotice ? (
          <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{eligibilityNotice}</span>
            <div className="flex flex-shrink-0 gap-2">
              <Link href="/kyc" className="rounded-lg bg-[#0d3d28] px-3 py-1.5 text-xs font-bold text-white">Améliorer mon KYC</Link>
              <button type="button" onClick={() => setEligibilityNotice(null)} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold">Fermer</button>
            </div>
          </div>
        ) : null}

        {myKycLevel !== null && assoc.minKycLevel !== undefined && assoc.minKycLevel !== null && myKycLevel < assoc.minKycLevel ? (
          <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />Cette association exige au minimum le niveau KYC {assoc.minKycLevel}. Votre niveau actuel est KYC {myKycLevel}.</span>
            <Link href="/kyc" className="flex-shrink-0 rounded-lg bg-sky-900 px-3 py-1.5 text-xs font-bold text-white">Passer au niveau requis</Link>
          </div>
        ) : null}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-md">
          <div className="h-3" style={{ backgroundColor: assoc.color }} />
          <div className="bg-warm-white px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Logo / Initials */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ backgroundColor: assoc.color }}
              >
                {getInitials(assoc.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{assoc.name}</h1>
                  <LifecycleBadge status={assoc.status} />
                  <TrustBadge score={assoc.trustScore} level={assoc.trustLevel} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-graphite">
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{getAssocTypeLabel(assoc.type)}</span>
                  {assoc.region && <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{assoc.region}</span>}
                  <span className="flex items-center gap-1 text-amber-700 font-medium">
                    Mon rôle : {getRoleLabel(myRole)}
                  </span>
                </div>
                {assoc.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{assoc.description}</p>
                )}
                {assoc.parent && (
                  <a href={`/associations/${assoc.parent.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline">
                    <Building2 className="w-3 h-3" /> Section de {assoc.parent.name}
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 flex-shrink-0 items-start">
                <NotificationsBell associationId={id} />
                <button
                  style={{ backgroundColor: "#0d3d28" }}
                  className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  onClick={() => { setTab("activities"); }}
                >
                  <Plus className="w-4 h-4" /> Rejoindre une activité
                </button>
                {isBureauMember && (
                  <button
                    className="inline-flex items-center gap-1.5 border border-[#cfe0d5] bg-white text-[#0d3d28] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#f6fbf7] transition-colors"
                    onClick={() => router.push(`/associations/${id}/kyc`)}
                  >
                    <ShieldCheck className="w-4 h-4" /> KYC
                  </button>
                )}
                {isBureauMember && (
                  <button
                    className="inline-flex items-center gap-1.5 border border-[#cfe0d5] bg-[#f6fbf7] text-[#0d3d28] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#ecf7ef] transition-colors"
                    onClick={() => router.push(`/associations/${id}/configuration`)}
                  >
                    <Settings className="w-4 h-4" /> Configurer
                  </button>
                )}
                <button
                  className="inline-flex items-center gap-1.5 border border-[#cfe0d5] bg-white text-[#0d3d28] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#f6fbf7] transition-colors"
                  onClick={() => router.push(`/associations/${id}/arp`)}
                >
                  <Boxes className="w-4 h-4" /> Cadre ARP
                </button>
                {isBureauMember && (
                  <button
                    className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                    onClick={() => router.push(`/associations/${id}/modifier`)}
                  >
                    <FileText className="w-4 h-4" /> Modifier
                  </button>
                )}
                {isBureauMember && (
                  <>
                    <button
                      className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                      onClick={() => {}}
                    >
                      <UserPlus className="w-4 h-4" /> Inviter un membre
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                      onClick={() => router.push(`/associations/${id}/parametres`)}
                    >
                      <Settings className="w-4 h-4" /> Paramètres
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                data-testid={`tab-${key}`}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  tab === key
                    ? "border-[#0d3d28] text-[#0d3d28] bg-[#f7f3eb]"
                    : "border-transparent text-graphite hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — VUE D'ENSEMBLE
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Membres actifs", value: members.filter(m => m.status === "ACTIVE").length, icon: <Users className="w-5 h-5" />, color: "#0d3d28" },
                { label: "Activités", value: activities.length, icon: <Activity className="w-5 h-5" />, color: "#d4a343" },
                { label: "Cotisé ce mois", value: formatCurrency(finances?.totalCollected ?? 0), icon: <DollarSign className="w-5 h-5" />, color: "#0d3d28" },
                { label: "Prochaine réunion", value: upcomingMeeting ? formatDate(upcomingMeeting.scheduledAt) : "Non planifiée", icon: <Calendar className="w-5 h-5" />, color: "#d4a343" },
              ].map((stat, i) => (
                <Card key={i} className="relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-graphite mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: stat.color }}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pôles d'activité — accès rapide par famille */}
            <Card>
              <CardHeader><CardTitle>Pôles d&apos;activité</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(() => {
                    const counts = activities.reduce<Record<string, number>>((acc, a) => {
                      acc[a.type] = (acc[a.type] ?? 0) + 1;
                      return acc;
                    }, {});
                    const tontineCount = (counts.TONTINE_ROTATIVE ?? 0) + (counts.TONTINE_ASCA ?? 0) + (counts.TONTINE_ENCHERES ?? 0);
                    const items = [
                      { label: "Tontines", count: tontineCount, icon: "🔄", color: "#0d3d28", href: `/associations/${id}?tab=activities&family=tontine`, onClick: () => setTab("activities") },
                      { label: "Épargne",  count: counts.EPARGNE ?? 0, icon: "💰", color: "#15803d", href: `/associations/${id}?tab=activities&family=epargne`, onClick: () => setTab("activities") },
                      { label: "Investissement", count: counts.INVESTISSEMENT ?? 0, icon: "📈", color: "#1e3a8a", href: `/associations/${id}?tab=activities&family=invest`, onClick: () => setTab("activities") },
                      { label: "Nature", count: counts.NATURE ?? 0, icon: "🌾", color: "#7c2d12", href: `/associations/${id}?tab=activities&family=nature`, onClick: () => setTab("activities") },
                      { label: "Aides sociales", count: counts.AIDE_SOLIDAIRE ?? 0, icon: "❤️", color: "#be123c", href: `/associations/${id}/aides`, onClick: null as null | (() => void) },
                      { label: "Prêts", count: counts.PRET ?? 0, icon: "🏦", color: "#d4a343", href: `/associations/${id}/prets`, onClick: null },
                      { label: "Réunions", count: meetings.length, icon: "📅", color: "#3b82f6", href: `/associations/${id}/reunions`, onClick: null },
                      { label: "Rapports", count: 0, icon: "📊", color: "#0d3d28", href: `/associations/${id}/rapports`, onClick: null },
                    ];
                    return items.map(it => (
                      <button
                        key={it.label}
                        onClick={() => it.onClick ? it.onClick() : router.push(it.href)}
                        className="flex flex-col items-start gap-1 p-3 rounded-xl border border-gray-200 bg-warm-white hover:bg-[#f7f3eb] hover:border-[#0d3d28] transition-all text-left"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl">{it.icon}</span>
                          {it.count > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: it.color }}>
                              {it.count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">{it.label}</p>
                      </button>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mes activités */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Mes activités ({myActivities.length})</CardTitle>
                      <button onClick={() => setTab("activities")} className="text-xs text-[#0d3d28] hover:underline flex items-center gap-1">
                        Voir tout <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {myActivities.length === 0 ? (
                      <div className="py-8 text-center text-ash text-sm">Vous n&apos;êtes abonné à aucune activité</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {myActivities.map(act => (
                          <div key={act.id} className="flex items-center gap-3 px-6 py-3">
                            <span className="text-2xl">{getActivityTypeIcon(act.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{act.name}</p>
                              <p className="text-xs text-graphite">
                                {act.contributionAmount ? formatCurrency(act.contributionAmount) : "Variable"} · {getFrequencyLabel(act.contributionFrequency)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Abonné ✓</p>
                              <p className="text-xs text-ash mt-0.5">Caisse : {formatCurrency(act.caisseBalance)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activités disponibles */}
                {availableActivities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Activités disponibles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-50">
                        {availableActivities.map(act => (
                          <div key={act.id} className="flex items-center gap-3 px-6 py-3">
                            <span className="text-2xl">{getActivityTypeIcon(act.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{act.name}</p>
                              <p className="text-xs text-graphite">
                                {act.contributionAmount ? formatCurrency(act.contributionAmount) : "Variable"} · {getFrequencyLabel(act.contributionFrequency)}
                              </p>
                            </div>
                            <button
                              onClick={() => setModalSubscribe(act)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                              style={{ backgroundColor: "#d4a343" }}
                            >
                              Souscrire
                            </button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Prochaine réunion */}
                <Card>
                  <CardHeader><CardTitle>Prochaine réunion</CardTitle></CardHeader>
                  <CardContent>
                    {upcomingMeeting ? (
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-gray-900">{upcomingMeeting.title ?? getMeetingTypeLabel(upcomingMeeting.type)}</p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(upcomingMeeting.scheduledAt)}</span>
                        </div>
                        {upcomingMeeting.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Shield className="w-3.5 h-3.5" />
                            <span>{upcomingMeeting.location}</span>
                          </div>
                        )}
                        <div className="mt-3 p-2 rounded-lg bg-gold/10 text-amber-800 text-xs">
                          Ordre du jour à confirmer
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ash">Aucune réunion planifiée</p>
                    )}
                  </CardContent>
                </Card>

                {/* Alertes bureau */}
                {isBureauMember && (
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Alertes bureau
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {members.filter(m => m.reliabilityScore < 50).length > 0 && (
                        <div className="flex items-start gap-2 text-sm p-2 bg-error/10 rounded-lg text-red-800">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{members.filter(m => m.reliabilityScore < 50).length} membre(s) avec faible fiabilité</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-sm p-2 bg-gold/10 rounded-lg text-amber-800">
                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>2 cotisations en retard ce mois</span>
                      </div>
                      <button
                        onClick={() => setModalSocialAid(true)}
                        className="w-full text-left flex items-start gap-2 text-sm p-2 bg-info/10 rounded-lg text-blue-800"
                      >
                        <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>1 demande d&apos;aide sociale en attente</span>
                      </button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — ACTIVITÉS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "activities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Activités de l&apos;association</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map(act => {
                const participationColor = act.participation === "MANDATORY"
                  ? "bg-green-100 text-green-800"
                  : act.participation === "OPTIONAL"
                    ? "bg-info/10 text-blue-800"
                    : "bg-warning/10 text-orange-800";
                const participationLabel = act.participation === "MANDATORY" ? "Obligatoire" : act.participation === "OPTIONAL" ? "Optionnel" : "Conditionnel";

                return (
                  <Card key={act.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedActivity(act)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{getActivityTypeIcon(act.type)}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{act.name}</p>
                            <p className="text-xs text-graphite">{getDistributionLabel(act.distributionMode)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${participationColor}`}>{participationLabel}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-xs text-ash">Cotisation</p>
                          <p className="font-medium text-gray-900">
                            {act.contributionAmount ? formatCurrency(act.contributionAmount) : "Variable"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ash">Fréquence</p>
                          <p className="font-medium text-gray-900">{getFrequencyLabel(act.contributionFrequency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ash">Distribution</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            {getDistributionIcon(act.distributionMode)} {getDistributionLabel(act.distributionMode)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ash">Abonnés</p>
                          <p className="font-medium text-gray-900">{act.subscriptions?.length ?? 0} / {members.length}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone">
                        <div className="text-xs text-graphite">
                          Caisse : <span className="font-semibold text-gray-800">{formatCurrency(act.caisseBalance)}</span>
                        </div>
                        {act.participation === "OPTIONAL" && !act.mySubscription ? (
                          <button
                            onClick={e => { e.stopPropagation(); setModalSubscribe(act); }}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                            style={{ backgroundColor: "#d4a343" }}
                          >
                            Souscrire
                          </button>
                        ) : act.mySubscription ? (
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Abonné ✓</span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Activity detail modal */}
            {selectedActivity && (
              <Modal title={selectedActivity.name} onClose={() => setSelectedActivity(null)}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getActivityTypeIcon(selectedActivity.type)}</span>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{selectedActivity.name}</p>
                      <p className="text-sm text-graphite">{getDistributionLabel(selectedActivity.distributionMode)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: "Type", value: selectedActivity.type },
                      { label: "Participation", value: selectedActivity.participation },
                      { label: "Cotisation", value: selectedActivity.contributionAmount ? formatCurrency(selectedActivity.contributionAmount) : "Variable" },
                      { label: "Fréquence", value: getFrequencyLabel(selectedActivity.contributionFrequency) },
                      { label: "Mode distribution", value: getDistributionLabel(selectedActivity.distributionMode) },
                      { label: "Caisse", value: formatCurrency(selectedActivity.caisseBalance) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-cream rounded-lg p-3">
                        <p className="text-xs text-ash mb-0.5">{label}</p>
                        <p className="font-medium text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => router.push(`/associations/${id}/activities/${selectedActivity?.id}`)}
                      className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-cream"
                    >
                      Voir les sessions
                    </button>
                    <button
                      onClick={() => router.push(`/associations/${id}/activities/${selectedActivity?.id}`)}
                      className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-cream"
                    >
                      Voir les cotisations
                    </button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — MEMBRES
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "members" && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
              </div>
              <select
                value={memberRoleFilter}
                onChange={e => setMemberRoleFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="PRESIDENT">Président</option>
                <option value="TREASURER">Trésorier</option>
                <option value="SECRETARY">Secrétaire</option>
                <option value="MEMBER">Membre</option>
              </select>
              <select
                value={memberStatusFilter}
                onChange={e => setMemberStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="SUSPENDED">Suspendu</option>
                <option value="PENDING">En attente</option>
              </select>
              {isBureauMember && (
                <button
                  onClick={() => setModalCotisation(true)}
                  className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  <Plus className="w-4 h-4" /> Enregistrer cotisation
                </button>
              )}
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone bg-cream">
                      <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Adhésion</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Fiabilité</th>
                      {isBureauMember && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMembers.map(member => (
                      <tr key={member.id} className="hover:bg-cream transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: "#0d3d28" }}
                            >
                              {getInitials(member.user.name)}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-medium text-gray-900">{member.user.name}</p>
                                <KycBadge level={member.user.kycLevel} status={member.user.kycStatus} />
                              </div>
                              <p className="text-xs text-ash">{member.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start ${getRoleBadgeClass(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </span>
                            {member.customRole && (
                              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full self-start text-white"
                                style={{ background: member.customRole.color }}>
                                {member.customRole.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {member.joinedAt ? formatDate(member.joinedAt) : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getReliabilityColor(member.reliabilityScore)}`}
                                style={{ width: `${member.reliabilityScore}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium">{member.reliabilityScore}%</span>
                          </div>
                        </td>
                        {isBureauMember && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              {member.user.kycRequests?.[0] ? (
                                <>
                                  <button
                                    onClick={() => reviewKyc(member.user.kycRequests![0].id, "APPROVE")}
                                    className="text-xs px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                    title={`Valider KYC ${member.user.kycRequests?.[0].requestedLevel}`}
                                  >
                                    KYC ✓
                                  </button>
                                  <button
                                    onClick={() => reviewKyc(member.user.kycRequests![0].id, "REJECT")}
                                    className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600"
                                    title="Refuser la demande KYC"
                                  >
                                    KYC ✕
                                  </button>
                                </>
                              ) : null}
                              <button
                                onClick={() => setEditingMemberRole(member)}
                                disabled={member.role === "FOUNDER"}
                                title={member.role === "FOUNDER" ? "Le fondateur ne peut être modifié" : "Modifier le rôle"}
                                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-cream text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Rôle
                              </button>
                              <Link
                                href={`/associations/${id}/members/${member.id}/solde`}
                                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-cream text-gray-600"
                                title="Solde de sortie / compensation"
                              >
                                Solde
                              </Link>
                              {member.status === "PENDING" ? (
                                <>
                                  <button
                                    onClick={() => {
                                      fetch(`/api/associations/${id}/members/${member.id}/actions`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ action: "ACCEPT" }),
                                      }).then(() => reloadMembers()).catch(() => {});
                                    }}
                                    className="text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50 text-green-600"
                                  >
                                    Accepter
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = window.prompt(
                                        "Motif du refus (minimum 20 caractères obligatoire) :"
                                      );
                                      if (!reason || reason.trim().length < 20) return;
                                      fetch(`/api/associations/${id}/members/${member.id}/actions`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ action: "REJECT", reason }),
                                      }).then(() => reloadMembers()).catch(() => {});
                                    }}
                                    className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-error/10 text-red-600"
                                  >
                                    Refuser
                                  </button>
                                </>
                              ) : member.status === "ACTIVE" ? (
                                <button
                                  onClick={() => {
                                    fetch(`/api/associations/${id}/members/${member.id}/actions`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "SUSPEND" }),
                                    }).then(() => reloadMembers()).catch(() => {});
                                  }}
                                  className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-error/10 text-red-600"
                                >
                                  Suspendre
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    fetch(`/api/associations/${id}/members/${member.id}/actions`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "REACTIVATE" }),
                                    }).then(() => reloadMembers()).catch(() => {});
                                  }}
                                  className="text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50 text-green-600"
                                >
                                  Réactiver
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={isBureauMember ? 6 : 5} className="py-10 text-center text-ash">
                          Aucun membre trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4 — RÉUNIONS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "meetings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Réunions</h2>
              {isBureauMember && (
                <button
                  onClick={() => setModalMeeting(true)}
                  className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  <Plus className="w-4 h-4" /> Planifier une réunion
                </button>
              )}
            </div>

            {/* Upcoming meetings */}
            <div>
              <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide mb-3">À venir</h3>
              <div className="space-y-3">
                {meetings.filter(m => m.status === "UPCOMING").map(meeting => (
                  <Card key={meeting.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMeeting(meeting)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-forest/10 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-[#0d3d28]">{new Date(meeting.scheduledAt).toLocaleDateString("fr", { day: "2-digit" })}</span>
                            <span className="text-xs text-[#0d3d28]">{new Date(meeting.scheduledAt).toLocaleDateString("fr", { month: "short" })}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{meeting.title ?? getMeetingTypeLabel(meeting.type)}</p>
                            <p className="text-sm text-graphite flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(meeting.scheduledAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                              {meeting.location && <><span className="mx-1">·</span>{meeting.location}</>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-blue-800">{getMeetingTypeLabel(meeting.type)}</span>
                          <StatusBadge status={meeting.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {meetings.filter(m => m.status === "UPCOMING").length === 0 && (
                  <div className="py-6 text-center text-ash text-sm">Aucune réunion à venir</div>
                )}
              </div>
            </div>

            {/* Past meetings */}
            <div>
              <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide mb-3">Passées</h3>
              <div className="space-y-3">
                {meetings.filter(m => m.status === "DONE").map(meeting => (
                  <Card key={meeting.id} className="cursor-pointer hover:shadow-md transition-shadow opacity-80" onClick={() => setSelectedMeeting(meeting)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">{new Date(meeting.scheduledAt).toLocaleDateString("fr", { day: "2-digit" })}</span>
                            <span className="text-xs text-graphite">{new Date(meeting.scheduledAt).toLocaleDateString("fr", { month: "short" })}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">{meeting.title ?? getMeetingTypeLabel(meeting.type)}</p>
                            <p className="text-sm text-ash flex items-center gap-2 mt-0.5">
                              <span>{meeting.attendeeCount ?? 0} présents</span>
                              {meeting.quorumReached ? (
                                <span className="flex items-center gap-0.5 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Quorum atteint</span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-error"><AlertCircle className="w-3.5 h-3.5" /> Pas de quorum</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={meeting.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Meeting detail modal */}
            {selectedMeeting && (
              <Modal title={selectedMeeting.title ?? getMeetingTypeLabel(selectedMeeting.type)} onClose={() => setSelectedMeeting(null)}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-xs text-ash mb-0.5">Date</p>
                      <p className="font-medium">{formatDate(selectedMeeting.scheduledAt)}</p>
                    </div>
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-xs text-ash mb-0.5">Type</p>
                      <p className="font-medium">{getMeetingTypeLabel(selectedMeeting.type)}</p>
                    </div>
                    {selectedMeeting.location && (
                      <div className="bg-cream rounded-lg p-3 col-span-2">
                        <p className="text-xs text-ash mb-0.5">Lieu</p>
                        <p className="font-medium">{selectedMeeting.location}</p>
                      </div>
                    )}
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-xs text-ash mb-0.5">Quorum</p>
                      <p className={`font-medium ${selectedMeeting.quorumReached ? "text-green-700" : "text-red-600"}`}>
                        {selectedMeeting.quorumReached ? "Atteint" : "Non atteint"}
                      </p>
                    </div>
                    {selectedMeeting.attendeeCount !== undefined && (
                      <div className="bg-cream rounded-lg p-3">
                        <p className="text-xs text-ash mb-0.5">Présents</p>
                        <p className="font-medium">{selectedMeeting.attendeeCount}</p>
                      </div>
                    )}
                  </div>
                  {selectedMeeting.status === "DONE" && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Présences</p>
                      <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                        {members.slice(0, 4).map((m, i) => {
                          const statuses = ["PRESENT", "PRESENT", "LATE", "ABSENT"];
                          const st = statuses[i] ?? "ABSENT";
                          const stColor = st === "PRESENT" ? "text-green-700" : st === "LATE" ? "text-amber-700" : "text-red-600";
                          return (
                            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                              <span className="text-gray-800">{m.user.name}</span>
                              <span className={`text-xs font-medium ${stColor}`}>{st}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5 — FINANCES
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "finances" && (
          <div className="space-y-6">
            {/* Balances par activité */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activities.map(act => (
                <Card key={act.id}>
                  <CardContent className="p-4">
                    <p className="text-xs text-graphite mb-1 truncate">{act.name}</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(act.caisseBalance)}</p>
                    <p className="text-xs text-ash mt-0.5">Caisse</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cotisations récentes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Cotisations récentes</CardTitle>
                    {isBureauMember && (
                      <button
                        onClick={() => setModalCotisation(true)}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: "#0d3d28" }}
                      >
                        + Enregistrer
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50">
                    {finances?.recentContributions?.map(c => (
                      <div key={c.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.memberName}</p>
                          <p className="text-xs text-graphite">{c.activityName} · {formatDate(c.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-gray-900">{formatCurrency(c.amount)}</p>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Synthèse financière</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-ash">Total collecté</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatCurrency(finances?.totalCollected ?? 0)}</p>
                    </div>
                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-ash">Attendu ce mois</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatCurrency(finances?.expectedMonthly ?? 0)}</p>
                    </div>
                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-ash">Couverture mensuelle</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {finances?.expectedMonthly ? `${Math.round((finances.totalCollected / finances.expectedMonthly) * 100)} %` : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-cream p-3">
                      <p className="text-xs text-ash">Caisse disponible</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatCurrency(finances?.caisseBalance ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comptes bancaires */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Comptes bancaires</CardTitle>
                  {(myRole === "PRESIDENT" || myRole === "TREASURER") && (
                    <button
                      onClick={() => setModalBank(true)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-cream"
                    >
                      + Ajouter un compte
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankAccounts.length === 0 ? (
                    <p className="py-4 text-center text-sm text-ash">
                      Aucun compte enregistré. Ajoutez le compte bancaire ou mobile money de l&apos;association.
                    </p>
                  ) : (
                    bankAccounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-3 p-3 rounded-xl bg-cream border border-stone">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0d3d28" }}>
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm text-gray-900">
                            {account.label}
                            {account.isDefault && <span className="ml-2 rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest">Par défaut</span>}
                          </p>
                          <p className="truncate text-xs text-graphite">
                            {[account.bankName, account.accountNumber || account.mobileNumber, account.mobileOperator].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 bg-info/10 text-blue-800 rounded-full">{account.type}</span>
                        {isBureauMember && (
                          <button
                            onClick={() => removeBankAccount(account.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Supprimer le compte"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Demandes d'aide sociales (bureau) */}
            {isBureauMember && (
              <Card className="border-blue-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-blue-800 flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Demandes d&apos;aide sociale en attente
                    </CardTitle>
                    <button
                      onClick={() => setModalSocialAid(true)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: "#0d3d28" }}
                    >
                      + Nouvelle demande
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {socialAids.filter((req) => req.status === "PENDING").length === 0 ? (
                      <p className="py-3 text-center text-xs text-ash">Aucune demande en attente.</p>
                    ) : (
                      socialAids.filter((req) => req.status === "PENDING").map((req) => (
                        <div key={req.id} className="flex items-center justify-between gap-3 p-3 bg-info/10 rounded-xl">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm text-gray-900">{req.membership?.user?.name ?? "Membre"}</p>
                            <p className="text-xs text-graphite">
                              {getAidCategoryLabel(req.category)} · {formatDate(req.createdAt)}
                              {req.urgencyLevel === "URGENT" && <span className="ml-2 font-semibold text-red-600">Urgent</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-gray-900">{formatCurrency(req.requestedAmount)}</p>
                            <div className="flex gap-1 mt-1">
                              <button onClick={() => decideAid(req.id, "APPROVE")} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">Approuver</button>
                              <button onClick={() => decideAid(req.id, "REJECT")} className="text-xs px-2 py-0.5 bg-error/10 text-red-700 rounded hover:bg-red-200">Refuser</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 6 — DOCUMENTS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "documents" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 text-sm font-medium text-gray-700">
                {filteredDocuments.length} document(s)
              </div>
              <select
                value={docTypeFilter}
                onChange={e => setDocTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              >
                <option value="ALL">Tous les types</option>
                <option value="REGLEMENT">Règlement</option>
                <option value="PV">Procès-verbal</option>
                <option value="RAPPORT">Rapport</option>
                <option value="STATUTS">Statuts</option>
              </select>
              {isBureauMember && (
                <button
                  onClick={() => setModalDocument(true)}
                  className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  <Upload className="w-4 h-4" /> Uploader un document
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-[#0d3d28]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-graphite mt-0.5">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{getDocTypeLabel(doc.type)}</span>
                          <span>·</span>
                          <span>{formatDate(doc.createdAt)}</span>
                          {doc.uploadedBy && <><span>·</span><span>{doc.uploadedBy}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doc.url && (
                          <>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-cream"
                            >
                              Voir
                            </a>
                            <a
                              href={doc.url}
                              download
                              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                              style={{ backgroundColor: "#0d3d28" }}
                            >
                              Télécharger
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredDocuments.length === 0 && (
                <div className="py-10 text-center text-ash text-sm">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  Aucun document trouvé
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 7 — CHAT
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "chat" && (
          <div className="flex flex-col" style={{ height: "65vh" }}>
            {/* Channel selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: "GENERAL", label: "# Général" },
                { key: "BUREAU", label: "# Bureau" },
                { key: "ANNONCES", label: "# Annonces" },
                ...activities.map(a => ({ key: `ACT_${a.id}`, label: `# ${a.name}` })),
              ].map(ch => (
                <button
                  key={ch.key}
                  onClick={() => setChatChannel(ch.key)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-full transition-all ${
                    chatChannel === ch.key
                      ? "text-white"
                      : "bg-warm-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  style={chatChannel === ch.key ? { backgroundColor: "#0d3d28" } : {}}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-ash text-sm">
                    <div className="text-center">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                      Aucun message dans ce canal
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === "me" ? "flex-row-reverse" : ""}`}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: "#0d3d28" }}
                      >
                        {getInitials(msg.senderName)}
                      </div>
                      <div className={`max-w-xs lg:max-w-md ${msg.senderId === "me" ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.senderId !== "me" && (
                            <span className="text-xs font-semibold text-gray-700">{msg.senderName}</span>
                          )}
                          <span className="text-xs text-ash">
                            {new Date(msg.createdAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            msg.senderId === "me"
                              ? "text-white rounded-tr-sm"
                              : "bg-gray-100 text-gray-900 rounded-tl-sm"
                          }`}
                          style={msg.senderId === "me" ? { backgroundColor: "#0d3d28" } : {}}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-stone p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Message dans ${chatChannel === "GENERAL" ? "Général" : chatChannel === "BUREAU" ? "Bureau" : chatChannel === "ANNONCES" ? "Annonces" : "ce canal"}...`}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2.5 rounded-xl text-white transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: "#0d3d28" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 8 — GOUVERNANCE
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "governance" && (
          <div className="space-y-6">
            <ElectionPanel associationId={id} />
            <WorkflowPanel associationId={id} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 9 — RELATIONS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "relations" && (
          <div className="space-y-6">
            <RelationsPanel associationId={id} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 10 — RAPPORTS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "reports" && (
          <div className="space-y-6">
            <ReportsPanel associationId={id} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODALES
        ══════════════════════════════════════════════════════════════════ */}

        {/* Modale Souscrire */}
        {modalSubscribe && (
          <Modal title={`Souscrire à : ${modalSubscribe.name}`} onClose={() => setModalSubscribe(null)}>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#f7f3eb] border border-[#d4a343]/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Cotisation unitaire</span>
                  <span className="font-semibold">{modalSubscribe.contributionAmount ? formatCurrency(modalSubscribe.contributionAmount) : "Variable"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fréquence</span>
                  <span className="font-semibold">{getFrequencyLabel(modalSubscribe.contributionFrequency)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de parts</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={subscribeForm.parts}
                  onChange={e => setSubscribeForm({ parts: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
                <p className="text-xs text-ash mt-1">Entre 1 et 5 parts</p>
              </div>
              {modalSubscribe.contributionAmount && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    Total mensuel : <strong>{formatCurrency(modalSubscribe.contributionAmount * subscribeForm.parts)}</strong>
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalSubscribe(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-cream">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/associations/${id}/activities/${modalSubscribe.id}/subscribe`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ parts: subscribeForm.parts }),
                    }).catch(() => null);
                    if (!res || !res.ok) {
                      const data = await res?.json().catch(() => ({}));
                      setEligibilityNotice(data?.error ?? "Souscription impossible.");
                      setModalSubscribe(null);
                      return;
                    }
                    setModalSubscribe(null);
                    setEligibilityNotice(null);
                    window.location.reload();
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  Confirmer la souscription
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modale Planifier réunion */}
        {modalMeeting && (
          <Modal title="Planifier une réunion" onClose={() => setModalMeeting(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure</label>
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={e => setMeetingForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu</label>
                <input
                  type="text"
                  placeholder="Salle de réunion, adresse..."
                  value={meetingForm.location}
                  onChange={e => setMeetingForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    value={meetingForm.type}
                    onChange={e => setMeetingForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="REGULAR">Session Ordinaire (50%)</option>
                    <option value="EXTRAORDINARY">Session Extraordinaire (66%)</option>
                    <option value="BUREAU_MEETING">Réunion de Bureau (66%)</option>
                    <option value="AG_ORDINARY">Assemblée Générale (75%)</option>
                    <option value="COMMISSION_MEETING">Réunion de Commission (50%)</option>
                    <option value="SPEECH_CIRCLE">Cercle de Parole (Sans quorum)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quorum (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={meetingForm.quorum}
                    onChange={e => setMeetingForm(f => ({ ...f, quorum: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordre du jour</label>
                <textarea
                  rows={3}
                  placeholder="Points à aborder..."
                  value={meetingForm.agenda}
                  onChange={e => setMeetingForm(f => ({ ...f, agenda: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalMeeting(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-cream">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    fetch(`/api/associations/${id}/meetings`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(meetingForm),
                    }).catch(() => {});
                    setModalMeeting(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  Planifier
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modale Upload document */}
        {modalDocument && (
          <Modal title="Uploader un document" onClose={() => setModalDocument(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du document</label>
                <input
                  type="text"
                  placeholder="ex: PV Réunion Mai 2026"
                  value={docForm.name}
                  onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select
                  value={docForm.type}
                  onChange={e => setDocForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="PV">Procès-verbal</option>
                  <option value="RAPPORT">Rapport</option>
                  <option value="REGLEMENT">Règlement</option>
                  <option value="STATUTS">Statuts</option>
                  <option value="CONTRAT">Contrat</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fichier</label>
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-[#0d3d28]/40">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-ash/60" />
                  <span className="text-sm font-medium text-[#0d3d28]">
                    {docFile ? docFile.name : "Parcourir un fichier"}
                  </span>
                  <p className="mt-1 text-xs text-ash">PDF, JPEG, PNG ou WEBP — max 10 Mo</p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalDocument(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-cream">
                  Annuler
                </button>
                <button
                  onClick={uploadDocument}
                  disabled={!docFile || uploading}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  {uploading ? "Envoi..." : "Uploader"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modale Enregistrer cotisation */}
        {modalCotisation && (
          <Modal title="Enregistrer une cotisation" onClose={() => setModalCotisation(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Membre</label>
                <select
                  value={cotisationForm.memberId}
                  onChange={e => setCotisationForm(f => ({ ...f, memberId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Sélectionner un membre</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Activité</label>
                <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Sélectionner une activité</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (FCFA)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={cotisationForm.amount}
                  onChange={e => setCotisationForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode de paiement</label>
                <select
                  value={cotisationForm.paymentMode}
                  onChange={e => setCotisationForm(f => ({ ...f, paymentMode: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="MTN_MOMO">MTN MoMo</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="WAVE">Wave</option>
                  <option value="CASH">Espèces</option>
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="EXPRESS_UNION">Express Union</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Référence de transaction</label>
                <input
                  type="text"
                  placeholder="ex: MTN-2026050412345"
                  value={cotisationForm.reference}
                  onChange={e => setCotisationForm(f => ({ ...f, reference: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalCotisation(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-cream">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    fetch(`/api/associations/${id}/contributions`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(cotisationForm),
                    }).catch(() => {});
                    setModalCotisation(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modale Demande d'aide sociale */}
        {modalSocialAid && (
          <Modal title="Demande d'aide sociale" onClose={() => setModalSocialAid(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                <select
                  value={socialAidForm.category}
                  onChange={e => setSocialAidForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
                >
                  {socialAidCaps.length > 0 ? socialAidCaps.map(cap => (
                    <option key={cap.category} value={cap.category}>
                      {cap.label} — plafond {formatCurrency(cap.cap)}
                    </option>
                  )) : (
                    <>
                      <option value="SANTE">Santé — plafond 500 000 FCFA</option>
                      <option value="EDUCATION">Éducation — plafond 300 000 FCFA</option>
                      <option value="DECES">Décès — plafond 1 000 000 FCFA</option>
                      <option value="MARIAGE">Mariage — plafond 200 000 FCFA</option>
                    </>
                  )}
                </select>
              </div>
              {socialAidCaps.length > 0 && (
                <div className="p-3 rounded-xl bg-gold/10 border border-amber-200 text-xs text-amber-800">
                  Plafond pour cette catégorie : <strong>
                    {formatCurrency(socialAidCaps.find(c => c.category === socialAidForm.category)?.cap ?? 0)}
                  </strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant demandé (FCFA)</label>
                <input
                  type="number"
                  placeholder="150000"
                  value={socialAidForm.amount}
                  onChange={e => setSocialAidForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Justification</label>
                <textarea
                  rows={3}
                  placeholder="Expliquez votre situation et le besoin d'aide..."
                  value={socialAidForm.justification}
                  onChange={e => setSocialAidForm(f => ({ ...f, justification: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalSocialAid(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-cream">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    fetch(`/api/associations/${id}/social-aids`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(socialAidForm),
                    }).catch(() => {});
                    setModalSocialAid(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: "#0d3d28" }}
                >
                  Soumettre la demande
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>

      {modalBank && (
        <Modal title="Ajouter un compte" onClose={() => setModalBank(false)}>
          <form onSubmit={addBankAccount} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Libellé</label>
              <input
                required
                value={bankForm.label}
                onChange={(e) => setBankForm(f => ({ ...f, label: e.target.value }))}
                placeholder="ex: Compte courant principal"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3d28]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={bankForm.type}
                  onChange={(e) => setBankForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                >
                  <option value="BANK">Compte bancaire</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CASH">Caisse</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Banque</label>
                <input
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                  placeholder="Afriland, SCB…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            {bankForm.type === "MOBILE_MONEY" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Opérateur</label>
                  <select
                    value={bankForm.mobileOperator}
                    onChange={(e) => setBankForm(f => ({ ...f, mobileOperator: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  >
                    <option value="MTN">MTN MoMo</option>
                    <option value="ORANGE">Orange Money</option>
                    <option value="WAVE">Wave</option>
                    <option value="EXPRESS_UNION">Express Union</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Numéro</label>
                  <input
                    value={bankForm.mobileNumber}
                    onChange={(e) => setBankForm(f => ({ ...f, mobileNumber: e.target.value }))}
                    placeholder="6XX XXX XXX"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Numéro de compte / IBAN</label>
                <input
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="Numéro de compte"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={bankForm.isDefault}
                onChange={(e) => setBankForm(f => ({ ...f, isDefault: e.target.checked }))}
                className="h-4 w-4 accent-forest"
              />
              Compte par défaut
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalBank(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700">
                Annuler
              </button>
              <button type="submit" className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white" style={{ backgroundColor: "#0d3d28" }}>
                Ajouter
              </button>
            </div>
          </form>
        </Modal>
      )}
      {editingMemberRole && (
        <MemberRoleModal
          associationId={id}
          member={editingMemberRole}
          customRoles={customRoles}
          onClose={() => setEditingMemberRole(null)}
          onSaved={() => { setEditingMemberRole(null); reloadMembers(); }}
        />
      )}
    </DashboardLayout>
  );
}

const BASE_ROLES: { value: string; label: string }[] = [
  { value: "MEMBER", label: "Membre" },
  { value: "PRESIDENT", label: "Président" },
  { value: "VICE_PRESIDENT", label: "Vice-président" },
  { value: "SECRETARY", label: "Secrétaire" },
  { value: "SECRETARY_ADJ", label: "Secrétaire adjoint" },
  { value: "TREASURER", label: "Trésorier" },
  { value: "TREASURER_ADJ", label: "Trésorier adjoint" },
  { value: "SOLIDARITY_OFFICER", label: "Resp. solidarité" },
  { value: "NATURE_OFFICER", label: "Resp. nature" },
  { value: "AUDITOR", label: "Commissaire aux comptes" },
  { value: "CENSOR", label: "Censeur" },
  { value: "ADVISOR", label: "Conseiller" },
];

function MemberRoleModal({
  associationId,
  member,
  customRoles,
  onClose,
  onSaved,
}: {
  associationId: string;
  member: AssocMember;
  customRoles: CustomRoleLite[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(member.role);
  const [customRoleId, setCustomRoleId] = useState<string>(member.customRoleId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setError(null);
    const r = await fetch(`/api/associations/${associationId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId: member.id, role, customRoleId: customRoleId || null }),
    });
    setSaving(false);
    if (r.ok) onSaved();
    else { const d = await r.json().catch(() => ({})); setError(d.error ?? "Erreur"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-warm-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-stone">
          <h3 className="text-base font-bold">Modifier le rôle</h3>
          <p className="text-xs text-graphite">{member.user.name} · {member.user.email}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-graphite uppercase tracking-wide mb-1 block">Rôle de base</label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              value={role} onChange={(e) => setRole(e.target.value)}>
              {BASE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-graphite uppercase tracking-wide mb-1 block">
              Rôle personnalisé (optionnel)
            </label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              value={customRoleId} onChange={(e) => setCustomRoleId(e.target.value)}>
              <option value="">— Aucun —</option>
              {customRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {customRoles.length === 0 && (
              <p className="text-xs text-ash mt-1 italic">Créez des rôles personnalisés depuis Paramètres.</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-5 py-3 border-t border-stone flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-cream">Annuler</button>
          <button onClick={save} disabled={saving}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-forest disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
