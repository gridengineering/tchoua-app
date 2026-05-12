"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code, BookOpen, GitBranch, GitPullRequest, Terminal, Copy, Check,
  ChevronDown, ChevronUp, Zap, Shield, Clock, MessageSquare,
  Webhook, AlertTriangle, Key, RefreshCw, Package, FileJson, Play,
  ArrowUpRight, Globe, Lock, Hash, Layers, Send, Wifi, Sparkles,
  FileText, Rss, Ban, Search, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicLayout } from "@/components/layout/public-layout";
import {
  apiCategories,
  changelog,
  sdkExamples,
  webhookEvents,
  webhookPayloadExample,
  errorCodes,
  authHeaders,
  type ApiEndpoint,
  type ApiCategory,
} from './developpeur-data';

const methodColors: Record<string, string> = {
  GET: 'bg-teal/15 text-teal border-teal/20',
  POST: 'bg-forest/15 text-forest border-forest/20',
  PUT: 'bg-gold/15 text-gold border-gold/20',
  DELETE: 'bg-error/15 text-error border-error/20',
  PATCH: 'bg-indigo/15 text-indigo border-indigo/20',
  WebSocket: 'bg-terracotta/15 text-terracotta border-terracotta/20',
};

const methodBg: Record<string, string> = {
  GET: 'bg-teal',
  POST: 'bg-forest',
  PUT: 'bg-gold',
  DELETE: 'bg-error',
  PATCH: 'bg-indigo',
  WebSocket: 'bg-terracotta',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/80 hover:bg-white text-graphite hover:text-forest transition-all z-10"
      title="Copier"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  const [trying, setTrying] = useState(false);
  const [tryResponse, setTryResponse] = useState<string | null>(null);

  const handleTry = () => {
    setTrying(true);
    setTryResponse(null);
    setTimeout(() => {
      setTrying(false);
      setTryResponse(JSON.stringify(endpoint.responseExample, null, 2));
    }, 1200);
  };

  const requestBody = endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : null;
  const responseBody = JSON.stringify(endpoint.responseExample, null, 2);

  return (
    <motion.div
      variants={cardVariants}
      className="border border-stone rounded-xl overflow-hidden bg-warm-white mb-4"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-cream/60 transition-colors"
      >
        <Badge
          className={`${methodColors[endpoint.method] || 'bg-ash/15 text-ash'} font-mono text-xs font-bold px-2 py-0.5 rounded-md border shrink-0`}
        >
          {endpoint.method}
        </Badge>
        <code className="font-mono text-sm text-charcoal truncate">{endpoint.path}</code>
        <span className="flex-1 hidden sm:block" />
        <span className="hidden sm:inline text-sm text-graphite font-body">{endpoint.description}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-ash shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ash shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <p className="text-sm text-graphite font-body leading-relaxed">{endpoint.description}</p>

              {endpoint.params && endpoint.params.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-ash mb-2">Paramètres</h4>
                  <div className="border border-stone rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-cream">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-black text-ash uppercase">Nom</th>
                          <th className="px-3 py-2 text-left text-xs font-black text-ash uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-black text-ash uppercase">Requis</th>
                          <th className="px-3 py-2 text-left text-xs font-black text-ash uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone">
                        {endpoint.params.map((p) => (
                          <tr key={p.name} className="hover:bg-cream/50">
                            <td className="px-3 py-2 font-mono text-charcoal text-xs font-bold">{p.name}</td>
                            <td className="px-3 py-2 font-mono text-teal text-xs">{p.type}</td>
                            <td className="px-3 py-2">
                              {p.required ? (
                                <Badge className="bg-error/10 text-error text-[10px]">Oui</Badge>
                              ) : (
                                <Badge className="bg-ash/10 text-ash text-[10px]">Non</Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 text-graphite text-xs">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {requestBody && (
                <div className="relative">
                  <h4 className="text-xs font-black uppercase tracking-widest text-ash mb-2">Corps de la requête</h4>
                  <pre className="bg-charcoal text-white rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-white/10">
                    {requestBody}
                  </pre>
                  <CopyCode code={requestBody} />
                </div>
              )}

              <div className="relative">
                <h4 className="text-xs font-black uppercase tracking-widest text-ash mb-2">Réponse attendue</h4>
                <pre className="bg-charcoal text-white rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-white/10">
                  {responseBody}
                </pre>
                <CopyCode code={responseBody} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  onClick={handleTry}
                  disabled={trying}
                  className="bg-forest hover:bg-forest-light text-white font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  {trying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Appel en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Tester l&apos;API
                    </>
                  )}
                </Button>
                <span className="text-[10px] text-ash font-black uppercase tracking-wider">v1 Sandbox Environment</span>
              </div>

              {tryResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">200 OK — Réponse Serveur</span>
                  </div>
                  <pre className="bg-success/5 border border-success/20 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed text-charcoal">
                    {tryResponse}
                  </pre>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CategorySection({ category }: { category: ApiCategory }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 group mb-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-forest/10 flex items-center justify-center shadow-sm">
          <Terminal className="w-6 h-6 text-forest" />
        </div>
        <div className="text-left">
          <h3 className="text-xl font-black text-charcoal group-hover:text-forest transition-colors">
            {category.label}
          </h3>
          <p className="text-sm text-ash font-bold">{category.description}</p>
        </div>
        <span className="flex-1" />
        <Badge className="bg-cream border-stone text-charcoal font-black text-xs px-3">
          {category.endpoints.length} ENDPOINTS
        </Badge>
        {open ? (
          <ChevronUp className="w-5 h-5 text-ash" />
        ) : (
          <ChevronDown className="w-5 h-5 text-ash" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {category.endpoints.map((ep, i) => (
              <EndpointCard key={`${category.id}-${ep.path}-${i}`} endpoint={ep} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DeveloppeursPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return apiCategories;
    const q = searchQuery.toLowerCase();
    return apiCategories
      .map((cat) => ({
        ...cat,
        endpoints: cat.endpoints.filter(
          (ep) =>
            ep.path.toLowerCase().includes(q) ||
            ep.description.toLowerCase().includes(q) ||
            ep.method.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.endpoints.length > 0);
  }, [searchQuery]);

  return (
    <PublicLayout>
      <div className="bg-cream -mt-8 -mx-6 min-h-screen">
        {/* Hero */}
        <section className="bg-charcoal text-white py-24 px-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="max-w-[1280px] mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                 <Code className="w-8 h-8 text-gold" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6">Documentation Développeur</h1>
              <p className="text-xl text-cream/60 max-w-2xl mx-auto mb-10 font-bold">
                Bâtissez l&apos;avenir de la finance solidaire. Intégrez Tchoua avec notre API REST, nos SDK et webhooks.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                 <Link href="#reference" className="px-8 py-4 bg-gold text-charcoal font-black rounded-2xl hover:bg-gold-light transition-all shadow-xl shadow-gold/20">
                    Explorer l&apos;API
                 </Link>
                 <Link href="https://github.com/gridengineering/tchoua-app" className="px-8 py-4 bg-white/10 border border-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2">
                    <GitBranch className="w-5 h-5" /> GitHub
                 </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="sticky top-20 z-30 py-6 px-6 bg-cream/80 backdrop-blur-md border-b border-stone shadow-sm">
           <div className="max-w-[1280px] mx-auto">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ash" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un endpoint, un paramètre ou un code d'erreur..."
                  className="w-full pl-14 pr-14 py-5 bg-warm-white border-2 border-stone rounded-3xl font-bold text-charcoal focus:border-forest outline-none transition-all shadow-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-stone rounded-xl">
                    <X className="w-5 h-5 text-ash" />
                  </button>
                )}
              </div>
           </div>
        </section>

        {/* Content */}
        <section className="py-24 px-6 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Sidebar Navigation */}
           <div className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-48 space-y-1">
                 <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-4 ml-4">Documentation</p>
                 {['Introduction', 'Authentification', 'Référence API', 'SDK', 'Webhooks', 'Erreurs'].map(item => (
                   <Link key={item} href={`#${item.toLowerCase()}`} className="block px-4 py-3 rounded-xl font-bold text-graphite hover:bg-forest/5 hover:text-forest transition-all">
                     {item}
                   </Link>
                 ))}
                 <div className="pt-8">
                    <p className="text-[10px] font-black text-ash uppercase tracking-widest mb-4 ml-4">Status</p>
                    <div className="px-4 py-3 bg-success/10 rounded-xl flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                       <span className="text-xs font-black text-success uppercase">API Online</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main Docs */}
           <div className="lg:col-span-9">
              {/* Getting Started */}
              <div id="introduction" className="mb-20">
                 <h2 className="text-3xl font-black text-charcoal mb-8 flex items-center gap-3">
                   <Zap className="w-8 h-8 text-gold" /> Démarrage Rapide
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-warm-white border border-stone rounded-3xl">
                       <Globe className="w-6 h-6 text-forest mb-4" />
                       <p className="text-xs font-black text-ash uppercase mb-1">Base URL</p>
                       <code className="text-sm font-bold text-charcoal">api.tchoua.app/v1</code>
                    </div>
                    <div className="p-6 bg-warm-white border border-stone rounded-3xl">
                       <Lock className="w-6 h-6 text-forest mb-4" />
                       <p className="text-xs font-black text-ash uppercase mb-1">Auth</p>
                       <p className="text-sm font-bold text-charcoal">Bearer + API Key</p>
                    </div>
                    <div className="p-6 bg-warm-white border border-stone rounded-3xl">
                       <Hash className="w-6 h-6 text-forest mb-4" />
                       <p className="text-xs font-black text-ash uppercase mb-1">Rate Limit</p>
                       <p className="text-sm font-bold text-charcoal">1,000 req / min</p>
                    </div>
                 </div>
                 <div className="bg-charcoal rounded-3xl p-8 relative">
                    <p className="text-xs font-black text-gold uppercase tracking-widest mb-4">Installation du SDK</p>
                    <pre className="text-white font-mono text-sm">npm install @tchoua/sdk-js</pre>
                    <CopyCode code="npm install @tchoua/sdk-js" />
                 </div>
              </div>

              {/* API Categories */}
              <div id="reference">
                 <h2 className="text-3xl font-black text-charcoal mb-12 flex items-center gap-3">
                   <FileJson className="w-8 h-8 text-forest" /> Référence API
                 </h2>
                 {filteredCategories.map(cat => (
                   <CategorySection key={cat.id} category={cat} />
                 ))}
              </div>

              {/* Webhooks */}
              <div id="webhooks" className="mt-20">
                 <h2 className="text-3xl font-black text-charcoal mb-8 flex items-center gap-3">
                    <Webhook className="w-8 h-8 text-terracotta" /> Webhooks
                 </h2>
                 <div className="bg-warm-white border border-stone rounded-3xl p-8">
                    <p className="text-lg font-bold text-graphite mb-6">Restez synchronisé en temps réel. Recevez des notifications HTTP lorsque des événements se produisent sur votre compte.</p>
                    <div className="space-y-4">
                       {webhookEvents.map(evt => (
                         <div key={evt.event} className="flex items-start gap-4 p-4 bg-cream rounded-2xl border border-stone">
                            <Wifi className="w-5 h-5 text-forest shrink-0 mt-1" />
                            <div>
                               <code className="text-sm font-black text-forest">{evt.event}</code>
                               <p className="text-sm text-graphite font-bold">{evt.description}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24 bg-charcoal text-white text-center -mx-6 px-6">
           <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-black mb-8">Besoin d&apos;aide pour l&apos;intégration ?</h2>
              <p className="text-xl text-cream/60 mb-10 font-bold">Notre équipe technique est là pour vous accompagner. Rejoignez notre communauté sur Discord.</p>
              <div className="flex flex-wrap justify-center gap-4">
                 <Button className="px-10 py-6 bg-indigo hover:bg-indigo-light text-white font-black rounded-2xl">
                    Rejoindre le Discord
                 </Button>
                 <Button className="px-10 py-6 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/10">
                    Contacter le Support API
                 </Button>
              </div>
           </div>
        </section>
      </div>
    </PublicLayout>
  );
}
