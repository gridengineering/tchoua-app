"use client";

import { useState, useEffect } from "react";
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Mail, 
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ChevronRight,
  Download,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  UserCheck,
  Users,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
const formatLocalDate = (date: string | Date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  systemRoleId: string | null;
  systemRole: { id: string, name: string } | null;
  createdAt: string;
  avatar?: string;
}

interface Role {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", systemRoleId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/roles")
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      if (usersData.users) setUsers(usersData.users);
      if (rolesData.roles) setRoles(rolesData.roles);
    } catch (err) {
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        name: user.name,
        email: user.email,
        password: "", // On ne change pas le mdp par défaut
        phone: user.phone || "",
        systemRoleId: user.systemRoleId || ""
      });
    } else {
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", phone: "", systemRoleId: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const method = editingUser ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        setShowModal(false);
        setToast({ message: editingUser ? "Utilisateur mis à jour" : "Utilisateur créé", type: "success" });
        fetchData();
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Une erreur est survenue", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur réseau", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) {
        setToast({ message: user.isActive ? "Compte désactivé" : "Compte réactivé", type: "success" });
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ message: data.error || "Action impossible", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur réseau", type: "error" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.systemRole?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed right-6 top-6 z-[60] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Utilisateurs Système</h1>
          <p className="text-gray-500 mt-1 font-medium">Gérez les comptes administratifs et les privilèges plateforme</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="px-8"
        >
          <UserPlus className="w-5 h-5" />
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{users.length}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Admin</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{users.filter(u => u.isActive).length}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Actifs</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{roles.length}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rôles Définis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Input 
            placeholder="Rechercher par nom, email ou rôle..." 
            leftIcon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" className="flex-1 md:flex-none">
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
          <Button variant="outline" size="sm" className="flex-1 md:flex-none">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-gray-400">Chargement de la liste...</p>
          </div>
        ) : error ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-red-500">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-400">
            <Search className="w-10 h-10" />
            <p className="text-sm font-bold">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle Système</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Créé le</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white shadow-sm group-hover:scale-110 transition-transform">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900">{user.name}</div>
                          <div className="text-xs font-bold text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-black border border-blue-100">
                        <Shield className="w-3.5 h-3.5" />
                        {user.systemRole?.name || "Sans rôle"}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <button 
                        onClick={() => toggleStatus(user)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                          user.isActive 
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                        {user.isActive ? "Actif" : "Désactivé"}
                      </button>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Clock className="w-3.5 h-3.5 opacity-50" />
                        {formatLocalDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-3 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Actions">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création/Édition */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur système"}</h2>
                <p className="text-sm font-bold text-gray-400 mt-1">Définissez les accès administratifs</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input 
                    label="Nom complet"
                    required
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="ex: Jean Dupont"
                  />
                  <Input 
                    label="Téléphone"
                    type="text" 
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+237 6xx xxx xxx"
                  />
              </div>

              <Input 
                label="Email professionnel"
                leftIcon={<Mail className="w-4 h-4" />}
                required
                type="email" 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="jean.dupont@tchoua.com"
              />

              <Input
                label={editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe temporaire"}
                required={!editingUser}
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editingUser ? "Laisser vide pour conserver l'actuel" : "••••••••"}
              />

              <Select 
                label="Rôle Système"
                leftIcon={<Shield className="w-4 h-4" />}
                required
                value={form.systemRoleId}
                onChange={e => setForm({...form, systemRoleId: e.target.value})}
                options={[
                  { value: "", label: "Sélectionner un rôle..." },
                  ...roles.map(role => ({ value: role.id, label: role.name }))
                ]}
              />

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  className="flex-1"
                >
                  {editingUser ? "Mettre à jour" : "Créer le compte"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Control Policy Card */}
      <div className="bg-[#f7f3eb] p-8 sm:p-12 rounded-[3rem] border border-[#e2ddd4] flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldAlert className="w-64 h-64 -mr-20 -mt-20" />
        </div>
        <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-2xl relative z-10">
          <ShieldAlert className="w-12 h-12 text-blue-400" />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Politique de Sécurité Platforme</h3>
          <p className="text-sm font-bold text-gray-500 mt-2 max-w-2xl leading-relaxed">
            La création d'un utilisateur système génère un audit log inaltérable. 
            Le rôle "Admin Principal" possède des privilèges absolus et ne peut être modifié que par lui-même.
          </p>
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Audit 100% Inaltérable
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> RBAC Strict
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = "/admin/roles"}
          className="group flex items-center gap-2 px-8 py-5 bg-white text-slate-900 border-2 border-slate-900 rounded-[1.5rem] font-black text-sm hover:bg-slate-900 hover:text-white shadow-lg transition-all relative z-10"
        >
          Gérer les Rôles
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
