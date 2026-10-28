"use client";

import { motion } from "framer-motion";
import { 
  Code, Terminal, Cpu, Database, 
  Globe, Zap, Shield, BookOpen, 
  ChevronRight, Copy, CheckCircle2,
  Lock, Key, Server, Laptop
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { PublicLayout } from "@/components/layout/public-layout";
import { DEVELOPER_DATA, ApiEndpoint } from "./developpeur-data";

export default function DevelopersPage() {
  const { lang } = useI18n();
  const currentLang = (lang === "fr" || lang === "en") ? lang : "fr";

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
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              API & SDK
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight">
              Bâtissez le Futur de la <span className="text-indigo-600">FinTech Sociale.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
              {DEVELOPER_DATA.intro[currentLang]}
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Documentation
              </button>
              <button className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Console API
              </button>
            </div>
          </motion.div>
          
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-100/50 rounded-full blur-[100px]" />
             <div className="relative z-10 bg-[#0d1117] rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden font-mono text-xs">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                   <div className="w-3 h-3 rounded-full bg-rose-500" />
                   <div className="w-3 h-3 rounded-full bg-amber-500" />
                   <div className="w-3 h-3 rounded-full bg-emerald-500" />
                   <span className="ml-4 text-gray-500">tchoua-sdk.js</span>
                </div>
                <div className="space-y-2">
                   <p className="text-purple-400">const <span className="text-blue-400">tchoua</span> = <span className="text-yellow-400">require</span>(<span className="text-emerald-400">&apos;@tchoua/sdk&apos;</span>);</p>
                   <p className="text-gray-500">{`// Initialize with your API Key`}</p>
                   <p className="text-purple-400">const <span className="text-blue-400">client</span> = <span className="text-purple-400">new</span> <span className="text-blue-400">tchoua.Client</span>(&apos;YOUR_API_KEY&apos;);</p>
                   <p className="text-gray-500 mt-4">{`// Create a new tontine`}</p>
                   <p className="text-purple-400">await <span className="text-blue-400">client</span>.tontines.<span className="text-yellow-400">create</span>({`{`}</p>
                   <p className="pl-4 text-blue-400">name: <span className="text-emerald-400">&apos;Solidarity Group&apos;</span>,</p>
                   <p className="pl-4 text-blue-400">cycle: <span className="text-emerald-400">&apos;MONTHLY&apos;</span>,</p>
                   <p className="pl-4 text-blue-400">amount: <span className="text-blue-400">25000</span></p>
                   <p className="text-purple-400">{`}`});</p>
                </div>
             </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="space-y-12">
           <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900">Endpoints Principaux</h2>
              <p className="text-gray-500 font-medium">Une API RESTful intuitive pour tous vos besoins.</p>
           </div>
           
           <div className="grid gap-6">
              {DEVELOPER_DATA.endpoints.map((endpoint: ApiEndpoint) => (
                 <div key={endpoint.path} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                       <div className={`px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest ${
                          endpoint.method === "GET" ? "bg-blue-50 text-blue-600" :
                          endpoint.method === "POST" ? "bg-emerald-50 text-emerald-600" :
                          "bg-amber-50 text-amber-600"
                       }`}>
                          {endpoint.method}
                       </div>
                       <div className="flex-1 space-y-2">
                          <p className="font-mono text-sm font-bold text-gray-900">{endpoint.path}</p>
                          <p className="text-gray-500 font-medium text-sm">{endpoint.description[currentLang]}</p>
                       </div>
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">
                          <Copy className="w-4 h-4" /> Copier
                       </button>
                    </div>
                    {endpoint.params && (
                       <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Paramètres</p>
                          <div className="grid md:grid-cols-3 gap-4">
                             {endpoint.params.map(param => (
                                <div key={param.name} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="font-mono text-xs font-black text-indigo-600">{param.name}</span>
                                      <span className="text-[8px] font-black text-gray-400 uppercase">{param.type}</span>
                                   </div>
                                   <p className="text-[10px] text-gray-500 font-medium">{param.description[currentLang]}</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </section>

        {/* Tech Stack & Security */}
        <section className="bg-indigo-900 rounded-[3rem] p-12 md:p-20 text-white">
           <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                 <h2 className="text-4xl font-black leading-tight">Conçu pour la Performance et la Sécurité.</h2>
                 <div className="grid grid-cols-2 gap-8">
                    {[
                       { title: "OAuth 2.0", desc: "Authentification sécurisée standard de l'industrie.", icon: Shield },
                       { title: "Webhooks", desc: "Recevez des notifications en temps réel pour vos événements.", icon: Zap },
                       { title: "SLA 99.9%", desc: "Une infrastructure robuste et toujours disponible.", icon: Server },
                       { title: "Sandboxing", desc: "Environnement de test complet pour vos développements.", icon: Laptop }
                    ].map(item => (
                       <div key={item.title} className="space-y-3">
                          <item.icon className="w-6 h-6 text-indigo-400" />
                          <h4 className="font-black">{item.title}</h4>
                          <p className="text-xs text-indigo-100/50 leading-relaxed font-medium">{item.desc}</p>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 backdrop-blur-sm space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-xl font-black">Rejoignez la Communauté</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                       Collaborez avec d&apos;autres développeurs, partagez vos outils et contribuez 
                       à l&apos;écosystème open-source de Tchoua.
                    </p>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all">
                       Accéder au GitHub
                    </button>
                    <button className="w-full py-4 bg-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-indigo-700 hover:bg-indigo-700 transition-all">
                       Discord Développeurs
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="text-center space-y-8">
           <h2 className="text-3xl md:text-5xl font-black text-gray-900">Prêt à coder ?</h2>
           <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto">
              Obtenez votre clé API en quelques secondes et commencez à construire. 
              Pas de processus de validation complexe pour démarrer.
           </p>
           <div className="pt-4">
              <Link href="/register" className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                Obtenir ma clé API
              </Link>
           </div>
        </section>
      </div>
    </PublicLayout>
  );
}
