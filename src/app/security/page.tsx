"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Server, Key, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { useI18n } from "@/lib/i18n/context";
import { SECURITY_COPY, publicLang } from "@/lib/i18n/public-copy";

const PILLAR_ICONS = [Lock, Server, Key];

export default function SecurityPage() {
  const { lang } = useI18n();
  const c = SECURITY_COPY[publicLang(lang)];

  return (
    <PublicLayout>
      <div className="space-y-24 pb-20">
        <section className="mx-auto max-w-4xl space-y-8 pt-12 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600 shadow-lg shadow-indigo-200">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-black leading-tight text-gray-900 md:text-7xl">
              {c.title1} <span className="text-indigo-600">{c.title2}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl font-medium leading-relaxed text-gray-500">{c.intro}</p>
          </motion.div>
        </section>

        <section className="grid gap-8 md:grid-cols-3">
          {c.pillars.map((item, idx) => {
            const Icon = PILLAR_ICONS[idx];
            return (
              <motion.div key={item.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-10 transition-all hover:shadow-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">{item.title}</h3>
                <p className="font-medium leading-relaxed text-gray-500">{item.desc}</p>
              </motion.div>
            );
          })}
        </section>

        <section className="rounded-[3rem] bg-gray-900 p-12 text-white md:p-20">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-10">
              <h2 className="text-4xl font-black leading-tight">{c.layersTitle}</h2>
              <div className="space-y-8">
                {c.layers.map((feature) => (
                  <div key={feature.title} className="flex gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <CheckCircle className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black">{feature.title}</h4>
                      <p className="text-sm font-medium leading-relaxed text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-[120px]" />
              <div className="relative z-10 space-y-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-sm font-black uppercase tracking-widest text-indigo-400">{c.statusTitle}</span>
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="space-y-4">
                  {c.statuses.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4">
                      <span className="text-sm font-bold text-gray-300">{item.label}</span>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-900/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{c.scan}</p>
                  <p className="text-xs font-bold text-white">{c.scanValue}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[3rem] border-2 border-indigo-100 bg-indigo-50 py-20 text-center">
          <div className="mx-auto max-w-2xl space-y-8">
            <h2 className="text-3xl font-black text-gray-900 md:text-5xl">{c.ctaTitle}</h2>
            <p className="text-lg font-medium text-gray-500">{c.ctaDesc}</p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/developpeurs" className="rounded-2xl bg-indigo-600 px-10 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-105">
                {c.dev}
              </Link>
              <Link href="/aide" className="rounded-2xl border-2 border-indigo-600 bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white">
                {c.support}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
