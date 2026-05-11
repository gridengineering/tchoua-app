"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Book, GraduationCap, ChevronRight, 
  Lightbulb, Info, HelpCircle, ArrowLeft,
  Filter, Sparkles, Globe, Menu, X
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { PublicLayout } from "@/components/layout/public-layout";
import { ACADEMY_ARTICLES, Article } from "./academie-articles";

export default function AcademiePage() {
  const { lang } = useI18n();
  const currentLang = (lang === "fr" || lang === "en" || lang === "es" || lang === "de") ? lang : "fr";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(ACADEMY_ARTICLES.map(a => a.category)))];

  const filteredArticles = ACADEMY_ARTICLES.filter(article => {
    const matchesSearch = article.title[currentLang].toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content[currentLang].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        
        {/* Header Section */}
        <section className="text-center space-y-6 pt-8">
          <div className="w-16 h-16 bg-forest/10 text-forest rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-charcoal leading-tight">
            Académie <span className="text-forest">Tchoua.</span>
          </h1>
          <p className="text-lg text-graphite font-medium max-w-2xl mx-auto">
            Apprenez à maîtriser la plateforme et découvrez comment digitaliser 
            votre association de manière efficace et sécurisée.
          </p>
        </section>

        {/* Search & Filters */}
        <section className="sticky top-24 z-30 bg-[#f7f3eb]/80 backdrop-blur-md py-4 -mx-6 px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center max-w-4xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ash" />
              <input 
                type="text"
                placeholder="Rechercher un sujet, une fonctionnalité..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone bg-warm-white focus:border-emerald-500 transition-all outline-none font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    activeCategory === cat 
                    ? "bg-forest text-white shadow-lg shadow-emerald-900/20" 
                    : "bg-warm-white text-gray-600 border border-stone hover:border-emerald-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Wiki Content */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Article List / Navigation */}
          <aside className="lg:col-span-4 space-y-4">
             <div className="bg-warm-white rounded-3xl border border-stone overflow-hidden shadow-sm">
                <div className="p-4 bg-cream border-b border-stone">
                  <span className="text-[10px] text-xs font-medium text-ash uppercase tracking-wider">Sommaire Wiki</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {filteredArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`w-full text-left p-4 flex items-center gap-4 transition-all group ${
                        selectedArticle?.id === article.id ? "bg-forest/10" : "hover:bg-cream"
                      }`}
                    >
                      <span className="text-xl">{article.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold truncate ${selectedArticle?.id === article.id ? "text-forest" : "text-gray-700"}`}>
                          {article.title[currentLang]}
                        </h4>
                        <span className="text-[10px] text-ash font-bold uppercase">{article.category}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${
                        selectedArticle?.id === article.id ? "text-emerald-500 translate-x-1" : "text-ash/60 opacity-0 group-hover:opacity-100"
                      }`} />
                    </button>
                  ))}
                  {filteredArticles.length === 0 && (
                    <div className="p-12 text-center text-ash space-y-4">
                      <HelpCircle className="w-10 h-10 mx-auto opacity-20" />
                      <p className="text-sm font-bold">Aucun article trouvé</p>
                    </div>
                  )}
                </div>
             </div>

             {/* Help Card */}
             <div className="bg-forest rounded-3xl p-6 text-white space-y-4 shadow-xl">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-black">Besoin d&apos;aide personnalisée ?</h3>
                <p className="text-xs text-emerald-50/70 leading-relaxed font-medium">
                  Nos conseillers sont disponibles pour vous accompagner dans la mise en place de votre association.
                </p>
                <Link href="/aide" className="block text-center py-3 bg-warm-white text-[#0d3d28] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                  Contacter le Support
                </Link>
             </div>
          </aside>

          {/* Article Display Area */}
          <main className="lg:col-span-8 min-h-[500px]">
             <AnimatePresence mode="wait">
                {selectedArticle ? (
                  <motion.article
                    key={selectedArticle.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-warm-white rounded-2xl border border-stone p-8 md:p-12 shadow-sm space-y-10"
                  >
                    <header className="space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-forest/10 text-forest rounded-lg text-[10px] text-xs font-medium text-ash uppercase tracking-wider">
                          {selectedArticle.category}
                        </span>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-semibold text-charcoal leading-tight flex items-center gap-4">
                        <span className="text-4xl">{selectedArticle.icon}</span>
                        {selectedArticle.title[currentLang]}
                      </h2>
                    </header>

                    <div className="prose prose-emerald max-w-none">
                      <p className="text-lg text-gray-600 leading-relaxed font-medium">
                        {selectedArticle.content[currentLang]}
                      </p>
                    </div>

                    <footer className="pt-10 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Book className="w-5 h-5 text-ash" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-ash uppercase tracking-widest">Dernière mise à jour</p>
                          <p className="text-sm font-bold text-gray-700">9 Mai 2026</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-xl border border-stone text-xs font-black text-graphite hover:bg-cream transition-all uppercase tracking-widest">
                          Utile 👍
                        </button>
                        <button className="px-4 py-2 rounded-xl border border-stone text-xs font-black text-graphite hover:bg-cream transition-all uppercase tracking-widest">
                          Signaler un bug 🐞
                        </button>
                      </div>
                    </footer>
                  </motion.article>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <Info className="w-10 h-10 text-ash/60" />
                    </div>
                    <h3 className="text-2xl font-black text-ash mb-4">Sélectionnez un article pour commencer</h3>
                    <p className="text-ash font-medium max-w-sm">
                      Utilisez la barre de recherche ou parcourez les catégories à gauche pour trouver les informations dont vous avez besoin.
                    </p>
                  </motion.div>
                )}
             </AnimatePresence>
          </main>

        </div>

        {/* Footer Note */}
        <section className="text-center py-12 border-t border-stone">
           <div className="flex items-center justify-center gap-2 text-ash mb-4">
             <Globe className="w-4 h-4" />
             <span className="text-xs font-bold uppercase tracking-widest">Documentation Multilingue</span>
           </div>
           <p className="text-sm text-graphite font-medium">
             Vous ne trouvez pas ce que vous cherchez ? <Link href="/aide" className="text-forest font-black hover:underline">Ouvrez un ticket support</Link> ou consultez notre <Link href="/how-it-works" className="text-forest font-black hover:underline">Guide de démarrage rapide</Link>.
           </p>
        </section>

      </div>
    </PublicLayout>
  );
}
