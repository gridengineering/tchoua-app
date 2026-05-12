"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, CheckCircle, Globe } from "lucide-react";
import { auth, googleProvider, facebookProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "authenticated") {
      router.push("/choose-space");
    }
  }, [mounted, status, router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "CredentialsSignin") {
      setError("Email ou mot de passe incorrect");
    } else if (errorParam) {
      setError("Une erreur est survenue lors de la connexion");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: true,
        callbackUrl: "/choose-space",
      });

      if (res?.error) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
      }
    } catch (err) {
      console.error("[LOGIN_ERROR]", err);
      setError("Une erreur inattendue est survenue");
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: "google" | "facebook") => {
    setSocialLoading(providerName);
    setError("");
    
    try {
      const provider = providerName === "google" ? googleProvider : facebookProvider;
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      // On transmet le login à NextAuth via le provider credentials (logic adapté dans lib/auth.ts)
      const res = await signIn("credentials", {
        email: user.email,
        firebaseToken: token,
        redirect: true,
        callbackUrl: "/choose-space",
      });

      if (res?.error) {
        setError("Erreur lors de la synchronisation du compte social");
      }
    } catch (err: any) {
      console.error(`[SOCIAL_LOGIN_ERROR] ${providerName}`, err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Connexion annulée");
      } else {
        setError("Échec de la connexion sociale");
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f7f3eb" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{ background: "#0d3d28" }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 80% 20%, #e68a00 0%, transparent 50%), radial-gradient(circle at 20% 80%, #2d7a52 0%, transparent 40%)"
          }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0d3d28]/20">
            <img src="/logo.png" alt="TCHOUA Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <div className="text-white font-bold text-xl">Tchoua</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>ERP Tontine · Open Source</div>
          </div>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Bienvenue sur<br />
            <span style={{ color: "#e68a00" }}>votre plateforme</span>
          </h2>
          <p className="mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Gérez vos tontines avec transparence, efficacité et solidarité.
          </p>
          <div className="space-y-3">
            {[
              "Cotisations Cash & Nature multi-supports",
              "Prêts, microfinance et solidarité",
              "Scoring, gamification et badges",
              "Chat, événements et marketplace",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#e68a00" }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm relative z-10" style={{ color: "rgba(255,255,255,0.4)" }}>
          &ldquo;Digitaliser la tontine, c'est amplifier la solidarité traditionnelle.&rdquo;
        </p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0d3d28] to-[#051f14] rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="font-bold text-xl" style={{ color: "#0d3d28" }}>Tchoua</div>
          </div>

          <h1 className="text-3xl font-bold mb-2" style={{ color: "#0d3d28" }}>Connexion</h1>
          <p className="text-gray-500 mb-8">Accédez à votre espace de gestion</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              placeholder="votremail@exemple.cm"
              leftIcon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && (
              <div className="border px-4 py-3 rounded-lg text-sm"
                style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#0d3d28" }}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#fcfcfc] px-2 text-gray-400">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={loading || !!socialLoading}
                onClick={() => handleSocialLogin("google")}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-60"
              >
                {socialLoading === "google" ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm">Google</span>
              </button>
              <button
                type="button"
                disabled={loading || !!socialLoading}
                onClick={() => handleSocialLogin("facebook")}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-60"
              >
                {socialLoading === "facebook" ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <FacebookIcon />
                )}
                <span className="text-sm">Facebook</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Pas encore de compte ?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "#0d3d28" }}>
                S'inscrire gratuitement
              </Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: "rgba(13,61,40,0.05)", border: "1px solid rgba(13,61,40,0.1)" }}>
              <p className="text-[10px] uppercase font-bold mb-2 tracking-wider" style={{ color: "#0d3d28" }}>👤 Membre Démo</p>
              <div className="space-y-1 mb-3">
                <p className="text-[11px] text-gray-500 truncate">demo@tchoua.cm</p>
                <p className="text-[11px] text-gray-500">demo123</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ email: "demo@tchoua.cm", password: "demo123" })}
                className="w-full text-[11px] font-bold py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: "#0d3d28", color: "white" }}
              >
                Remplir
              </button>
            </div>

            <div className="p-4 rounded-xl" style={{ background: "rgba(212,163,67,0.08)", border: "1px solid rgba(212,163,67,0.15)" }}>
              <p className="text-[10px] uppercase font-bold mb-2 tracking-wider" style={{ color: "#b48a3a" }}>👑 Admin Système</p>
              <div className="space-y-1 mb-3">
                <p className="text-[11px] text-gray-500 truncate">admin@tchoua.com</p>
                <p className="text-[11px] text-gray-500">Admin1234</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ email: "admin@tchoua.com", password: "Admin1234" })}
                className="w-full text-[11px] font-bold py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: "#e68a00", color: "white" }}
              >
                Remplir
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3eb]">
        <div className="w-12 h-12 border-4 border-[#0d3d28] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
