"use client";

import { motion } from "framer-motion";
import { Eye, Globe2, Shield, Heart } from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { useI18n } from "@/lib/i18n/context";
import { ABOUT_COPY, publicLang } from "@/lib/i18n/public-copy";

const VALUE_ICONS = [Eye, Globe2, Shield];

export default function AboutPage() {
  const { lang } = useI18n();
  const c = ABOUT_COPY[publicLang(lang)];

  return (
    <PublicLayout>
      <div className="space-y-24 pb-20">
        <section className="mx-auto max-w-4xl space-y-8 pt-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="mb-6 inline-block rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              {c.badge}
            </span>
            <h1 className="text-5xl font-black leading-tight text-gray-900 md:text-7xl">
              {c.title1} <span className="text-emerald-600">{c.title2}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl font-medium leading-relaxed text-gray-500">{c.intro}</p>
          </motion.div>
        </section>

        <section className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <h2 className="text-4xl font-black leading-tight text-gray-900">{c.storyTitle}</h2>
            <div className="space-y-6 text-lg font-medium leading-relaxed text-gray-500">
              <p>{c.story1}</p>
              <p>{c.story2}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <p className="text-4xl font-black text-emerald-600">100%</p>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{c.openSource}</p>
              </div>
              <div>
                <p className="text-4xl font-black text-emerald-600">{c.free}</p>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{c.forGroups}</p>
              </div>
            </div>
          </div>
          <div className="relative flex h-[500px] items-center justify-center overflow-hidden rounded-[3rem] bg-gray-100">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(/pattern-kente.svg)", backgroundSize: "300px" }} />
            <div className="relative z-10 flex h-4/5 w-4/5 flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <Heart className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">{c.trustTitle}</h3>
                <p className="text-sm font-medium text-gray-400">{c.trustDesc}</p>
              </div>
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-xs font-black text-gray-400">M{i}</div>
                ))}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-xs font-black text-white">+50</div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-16">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 md:text-5xl">{c.valuesTitle}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {c.values.map((item, idx) => {
              const Icon = VALUE_ICONS[idx];
              return (
                <motion.div key={item.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-10 text-center transition-all hover:shadow-xl">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{item.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-gray-500">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[3rem] bg-emerald-900 py-20 text-center text-white">
          <h2 className="mb-8 text-3xl font-black md:text-5xl">{c.ctaTitle}</h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-emerald-100/70">{c.ctaDesc}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-2xl bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-emerald-900 shadow-xl transition-all hover:scale-105">
              {c.ctaStart}
            </Link>
            <a href="mailto:contact@tchoua.com" className="rounded-2xl border border-emerald-700 bg-emerald-800 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700">
              {c.ctaContact}
            </a>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
