"use client";

import { motion } from "framer-motion";
import { 
  Smartphone, Zap, Bell, Shield, Globe, 
  Download, ArrowRight, CheckCircle2, 
  MessageSquare, Camera, Fingerprint, 
  WifiOff, Share2, Star
} from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";

export default function MobilePage() {
  return (
    <PublicLayout>
      <div className="space-y-24 pb-20">
        
        {/* Hero Section */}
        <section className="relative pt-12 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
              Expérience Mobile First
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight">
              Votre Tontine dans la <span className="text-blue-600">Poche.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
              Une application fluide, rapide et sécurisée pour gérer votre association 
              partout où vous êtes, même avec une connexion limitée.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/downloads/tchoua-android-1.0.0.apk" download className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                <Download className="w-5 h-5" /> Télécharger Android
              </a>
              <button type="button" disabled title="La version iOS doit être signée avec un certificat Apple Developer." className="flex cursor-not-allowed items-center gap-3 px-8 py-4 bg-gray-200 text-gray-500 rounded-2xl font-black text-sm uppercase tracking-widest">
                <Download className="w-5 h-5" /> iOS — signature Apple requise
              </button>
            </div>
            <p className="text-xs font-semibold leading-5 text-gray-400">
              Android 1.0.0 · APK direct. La version iOS nécessite un compte Apple Developer et une compilation Xcode/EAS signée.
            </p>
          </motion.div>
          
          <div className="relative flex justify-center">
             <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-[100px] scale-75" />
             <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-64 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden"
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
                <div className="h-full bg-white p-4 space-y-6">
                   <div className="flex justify-between items-center pt-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100" />
                      <Bell className="w-5 h-5 text-gray-300" />
                   </div>
                   <div className="h-32 bg-emerald-50 rounded-2xl p-4 space-y-2">
                      <div className="w-1/2 h-2 bg-emerald-200 rounded-full" />
                      <div className="w-full h-8 bg-white rounded-xl shadow-sm" />
                   </div>
                   <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                         <div key={i} className="h-16 bg-gray-50 rounded-xl flex items-center gap-3 px-3">
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm" />
                            <div className="flex-1 space-y-2">
                               <div className="w-2/3 h-2 bg-gray-200 rounded-full" />
                               <div className="w-1/3 h-1.5 bg-gray-100 rounded-full" />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8">
           {[
              {
                title: "Notifications Push",
                desc: "Soyez alerté instantanément pour les rappels de cotisations, les résultats de tirages et les aides sociales.",
                icon: Bell,
                color: "blue"
              },
              {
                title: "Scanner de Preuves",
                desc: "Prenez en photo vos reçus Mobile Money ou vos livraisons en nature pour une validation instantanée.",
                icon: Camera,
                color: "emerald"
              },
              {
                title: "Mode Hors-Ligne",
                desc: "Consultez vos soldes et préparez vos transactions même sans internet. La synchro se fait dès la reco.",
                icon: WifiOff,
                color: "amber"
              },
              {
                title: "Sécurité Biométrique",
                desc: "Accédez à vos comptes avec FaceID ou votre empreinte digitale pour une sécurité maximale.",
                icon: Fingerprint,
                color: "purple"
              },
              {
                title: "Partage Rapide",
                desc: "Générez des rapports PDF ou des invitations WhatsApp en un clic pour vos membres.",
                icon: Share2,
                color: "rose"
              },
              {
                title: "Support Local",
                desc: "Traduit en langues nationales pour une accessibilité totale à tous vos membres.",
                icon: Globe,
                color: "indigo"
              }
           ].map((item, idx) => (
             <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-white rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all group"
             >
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                   <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{item.desc}</p>
             </motion.div>
           ))}
        </section>

        {/* Low Tech Support */}
        <section className="bg-emerald-900 rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mb-48" />
           <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Inclusivité Totale : <span className="text-amber-400">Pas de Smartphone ? Pas de Problème.</span></h2>
                 <p className="text-lg text-emerald-50/80 font-medium mb-10 leading-relaxed">
                    Tchoua est conçu pour ne laisser personne de côté. Nous supportons les canaux 
                    traditionnels pour une couverture à 100% de votre association.
                 </p>
                 <div className="space-y-6">
                    {[
                       { title: "Code USSD (*123#)", desc: "Consultez vos soldes et validez des cotisations sur n'importe quel téléphone." },
                       { title: "SMS Interactifs", desc: "Recevez des alertes et envoyez des commandes par message texte." },
                       { title: "Serveur Vocal IVR", desc: "Interagissez avec la plateforme par appel vocal en langues locales." }
                    ].map(feature => (
                       <div key={feature.title} className="flex gap-4">
                          <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
                          <div>
                             <h4 className="font-black text-white">{feature.title}</h4>
                             <p className="text-sm text-emerald-100/60 font-medium">{feature.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="flex justify-center">
                 <div className="w-48 h-80 bg-gray-800 rounded-3xl border-4 border-gray-700 shadow-2xl p-4 flex flex-col items-center">
                    <div className="w-full h-32 bg-gray-900 rounded-xl mb-4 p-2 font-mono text-[10px] text-emerald-400">
                       --- TCHOUA USSD ---
                       1. Mon Solde
                       2. Cotiser
                       3. Aide Sociale
                       4. Parametres
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full">
                       {[...Array(12)].map((_, i) => (
                          <div key={i} className="h-8 bg-gray-700 rounded-lg" />
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA */}
        <section className="text-center py-20 bg-blue-50 rounded-[3rem] border-2 border-blue-100">
           <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-8">Disponible partout.</h2>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/downloads/tchoua-android-1.0.0.apk" download className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                Télécharger l&apos;App Android
              </a>
              <Link href="/register" className="px-10 py-5 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all">
                Tester la Web App
              </Link>
           </div>
        </section>
      </div>
    </PublicLayout>
  );
}
