"use client";

import { useState } from "react";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { AIDE_COPY, publicLang } from "@/lib/i18n/public-copy";
import { HelpCircle, Search, MessageCircle, Mail, Book, ChevronRight } from "lucide-react";

const TOPIC_ICONS = ["🚀", "🔄", "💰", "🤝", "🏆", "🏛️", "📅", "❤️", "🔒"];
const CARD_ICONS = [Book, MessageCircle, Mail];

export default function AidePage() {
  const { t, lang } = useI18n();
  const c = AIDE_COPY[publicLang(lang)];
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filtered = c.topics.filter(
    (tp) => tp.title.toLowerCase().includes(search.toLowerCase()) || tp.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdaptiveLayout title={t.nav.aide ?? c.title}>
      <div className="space-y-8">
        <div className="rounded-3xl p-8 text-center text-white" style={{ background: "linear-gradient(135deg,#0d3d28 0%,#0a2f1f 100%)" }}>
          <HelpCircle className="mx-auto mb-3 h-12 w-12" style={{ color: "#e68a00" }} />
          <h1 className="mb-2 text-3xl font-bold">{c.heroTitle}</h1>
          <p className="mb-6 opacity-70">{c.heroSubtitle}</p>
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={c.search}
              className="w-full rounded-full bg-white py-3 pl-12 pr-4 text-gray-900 outline-none"
            />
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">{c.topicsTitle}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {filtered.map((tp) => {
              const index = c.topics.findIndex((item) => item.title === tp.title);
              return (
                <Card key={tp.title} className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{TOPIC_ICONS[index]}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{tp.title}</div>
                        <div className="mt-1 text-sm text-gray-500">{tp.desc}</div>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full rounded-xl bg-white p-6 text-center text-sm text-gray-500">
                {lang === "fr" ? "Aucun résultat." : lang === "es" ? "Sin resultados." : lang === "de" ? "Keine Ergebnisse." : "No results."}
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">{c.faqTitle}</h2>
          <div className="space-y-2">
            {c.faqs.map((f, i) => (
              <Card key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                  <span className="font-medium text-gray-900">{f.q}</span>
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && <div className="-mt-2 px-5 pb-5 text-sm text-gray-600">{f.a}</div>}
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">{c.moreTitle}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {c.cards.map((card, i) => {
              const Icon = CARD_ICONS[i];
              return (
                <Card key={card.title}>
                  <CardContent className="p-5 text-center">
                    <Icon className="mx-auto mb-2 h-8 w-8" style={{ color: "#0d3d28" }} />
                    <div className="font-semibold text-gray-900">{card.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{card.desc}</div>
                    <a href={card.href} className="mt-2 inline-block text-sm font-medium" style={{ color: "#e68a00" }}>{card.cta}</a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </AdaptiveLayout>
  );
}
