"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { User, Mail, Lock, Phone, MapPin } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    profession: "", location: "", referralCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: true,
        callbackUrl: "/dashboard",
      });

      // NextAuth gère la redirection automatique
      return;
    } catch {
      setError("Erreur de connexion. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #f3f4f6, #ede9fe)" }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">T</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-xl">Tchoua</div>
            <div className="text-gray-500 text-xs">Créer votre compte</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Inscription</h1>
        <p className="text-gray-500 text-sm mb-6">Rejoignez la communauté des tontines digitales</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nom complet *"
                placeholder="Jean-Baptiste Nkomo"
                leftIcon={<User className="w-4 h-4" />}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <Input
              label="Email *"
              type="email"
              placeholder="jean@exemple.cm"
              leftIcon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+237 6XXXXXXXX"
              leftIcon={<Phone className="w-4 h-4" />}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Input
              label="Mot de passe *"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
            <Input
              label="Confirmer mot de passe *"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
            <Select
              label="Profession"
              value={form.profession}
              onChange={(e) => update("profession", e.target.value)}
              options={[
                { value: "", label: "Sélectionner..." },
                { value: "agriculture", label: "Agriculture / Élevage" },
                { value: "commerce", label: "Commerce / Négoce" },
                { value: "artisanat", label: "Artisanat" },
                { value: "education", label: "Éducation" },
                { value: "sante", label: "Santé" },
                { value: "fonction_publique", label: "Fonction publique" },
                { value: "entrepreneur", label: "Entrepreneur / PME" },
                { value: "transport", label: "Transport" },
                { value: "autre", label: "Autre" },
              ]}
            />
            <Input
              label="Ville / Région"
              placeholder="Douala, Yaoundé..."
              leftIcon={<MapPin className="w-4 h-4" />}
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
            <div className="col-span-2">
              <Input
                label="Code de parrainage (optionnel)"
                placeholder="Code fourni par un membre"
                value={form.referralCode}
                onChange={(e) => update("referralCode", e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-violet-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
        <p className="text-center text-gray-400 text-xs mt-3">
          Après l&apos;inscription, vous devrez accepter les conditions d&apos;utilisation, la politique de confidentialité,
          la protection des données et l&apos;engagement de non-divulgation avant d&apos;accéder à votre espace.
        </p>
      </div>
    </div>
  );
}
