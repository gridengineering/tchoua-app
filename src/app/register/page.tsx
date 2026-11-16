"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { User, Mail, Lock, Phone, MapPin } from "lucide-react";
import { detectLocaleDefaults } from "@/lib/identity";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    profession: "", location: "", referralCode: "",
    country: "", dialCode: "", city: "", language: "fr",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaults = detectLocaleDefaults(timeZone, navigator.language);
    setForm((f) => ({
      ...f,
      ...(ref ? { referralCode: ref } : {}),
      city: f.city,
      language: defaults.language,
    }));
  }, []);

  const handleSocialRegister = async (provider: "google" | "facebook" | "linkedin" | "instagram") => {
    setSocialLoading(provider);
    setError("");
    try {
      await signIn(provider, { callbackUrl: "/consentements" });
    } catch {
      setError(`Erreur lors de l'inscription avec ${provider}`);
      setSocialLoading(null);
    }
  };

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Renseignez une adresse e-mail ou un numéro de téléphone.");
      return;
    }
    if (!form.city.trim()) {
      setError("La ville est obligatoire.");
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
        identifier: form.email.trim() || form.phone.trim(),
        countryCode: form.dialCode,
        password: form.password,
        redirect: true,
        callbackUrl: "/consentements",
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
              label="Email (recommandé)"
              type="email"
              placeholder="jean@exemple.cm"
              leftIcon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <Input
              label="Téléphone (indicatif inclus)"
              type="tel"
              placeholder="237677112255"
              leftIcon={<Phone className="w-4 h-4" />}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <p className="col-span-2 -mt-1 text-[11px] leading-4 text-gray-500">
              Renseignez au moins un email ou un téléphone. Les deux sont uniques et servent d’identifiant de connexion.
            </p>
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
            <Input
              label="Pays *"
              placeholder="Ex. Cameroun, France, Nigéria…"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              required
            />
            <Input
              label="Indicatif pays (téléphone) *"
              placeholder="Ex. 237, 33, 1…"
              inputMode="numeric"
              value={form.dialCode}
              onChange={(e) => update("dialCode", e.target.value)}
              required
            />
            <Input
              label="Ville *"
              placeholder="Douala, Yaoundé..."
              leftIcon={<MapPin className="w-4 h-4" />}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
            />
            <Select
              label="Langue *"
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
              options={[
                { value: "fr", label: "Français" },
                { value: "en", label: "English" },
                { value: "es", label: "Español" },
                { value: "de", label: "Deutsch" },
              ]}
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
            <div className="col-span-2">
              <Input
                label="Quartier / adresse (optionnel)"
                placeholder="Ex. Bonapriso, rue 12"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium">Ou s&apos;inscrire avec (SSO)</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading || !!socialLoading}
              onClick={() => handleSocialRegister("google")}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-60 text-sm"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold">G</span>
              Google
            </button>
            <button
              type="button"
              disabled={loading || !!socialLoading}
              onClick={() => handleSocialRegister("facebook")}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-60 text-sm"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1877F2] text-white text-[11px] font-bold">f</span>
              Facebook
            </button>
            <button
              type="button"
              disabled={loading || !!socialLoading}
              onClick={() => handleSocialRegister("linkedin")}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-60 text-sm"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#0A66C2] text-white text-[11px] font-bold">in</span>
              LinkedIn
            </button>
            {process.env.NEXT_PUBLIC_SSO_INSTAGRAM === "true" && (
              <button
                type="button"
                disabled={loading || !!socialLoading}
                onClick={() => handleSocialRegister("instagram")}
                className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-60 text-sm"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white text-[11px] font-bold">IG</span>
                Instagram
              </button>
            )}
          </div>
        </div>

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
