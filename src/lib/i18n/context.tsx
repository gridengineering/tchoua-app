// @ts-nocheck
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, Lang, localTranslations } from "./translations";

type AnyTranslation = (typeof translations)[Lang];

interface CustomLang {
  code: string;
  name: string;
  flag: string;
  translations: Partial<AnyTranslation>;
}

interface LangMeta { code: string; name: string; flag: string; }

interface I18nContextType {
  lang: string;
  setLang: (l: string) => void;
  t: AnyTranslation;
  availableLangs: LangMeta[];
  refreshLangs: () => Promise<void>;
}

const BUILTIN: LangMeta[] = [
  { code: "fr",       name: "Français",  flag: "🇫🇷" },
  { code: "en",       name: "English",   flag: "🇬🇧" },
  { code: "es",       name: "Español",   flag: "🇪🇸" },
  { code: "de",       name: "Deutsch",   flag: "🇩🇪" },
  // ─── Langues locales Camerounaises ───────────────────────────────────────
  { code: "ghomala",  name: "Ghomala'",  flag: "🇨🇲" },
  { code: "ewondo",   name: "Ewondo",    flag: "🇨🇲" },
  { code: "douala",   name: "Douala",    flag: "🇨🇲" },
  { code: "fulfulde", name: "Fulfulde",  flag: "🇨🇲" },
];

const I18nContext = createContext<I18nContextType>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
  availableLangs: BUILTIN,
  refreshLangs: async () => {},
});

// Deep merge: fallback strings come from FR for missing keys
function mergeWithFallback(custom: Partial<AnyTranslation>): AnyTranslation {
  const base = translations.fr as any;
  const out: any = {};
  for (const section of Object.keys(base)) {
    out[section] = { ...base[section], ...((custom as any)?.[section] ?? {}) };
  }
  return out as AnyTranslation;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>("fr");
  const [customLangs, setCustomLangs] = useState<CustomLang[]>([]);
  const [activeT, setActiveT] = useState<AnyTranslation>(translations.fr);

  const refreshLangs = useCallback(async () => {
    try {
      const r = await fetch("/api/languages");
      if (!r.ok) return;
      const data = await r.json();
      setCustomLangs(data.languages ?? []);
    } catch {}
  }, []);

  const loadTranslation = useCallback(async (l: string) => {
    // 1. Check built-in static translations
    if (l in translations) {
      setActiveT(translations[l as Lang]);
      return;
    }

    // 2. Check local languages with light built-in data
    if (l in localTranslations) {
      setActiveT(mergeWithFallback(localTranslations[l as keyof typeof localTranslations]));
      return;
    }

    // 3. Try to load from JSON files for extended dictionaries (fr, en, es, de)
    try {
      if (["fr", "en", "es", "de", "ghomala", "ewondo", "douala", "fulfulde"].includes(l)) {
        const dict = await import(`./locales/${l}.json`).then(m => m.default || m);
        setActiveT(mergeWithFallback(dict));
        return;
      }
    } catch (e) {
      console.warn(`Could not load JSON locale for ${l}`, e);
    }

    // 4. Fallback to custom langs from API
    // On n'utilise plus customLangs comme dépendance directe pour éviter la boucle
    setActiveT(translations.fr);
  }, []); // Dépendance vide pour éviter de redéfinir la fonction à chaque changement de customLangs

  useEffect(() => {
    const stored = localStorage.getItem("tchoua_lang");
    const initialLang = stored || "fr";
    setLangState(initialLang);
    loadTranslation(initialLang);
    refreshLangs();
  }, [refreshLangs, loadTranslation]);

  const setLang = async (l: string) => {
    setLangState(l);
    localStorage.setItem("tchoua_lang", l);
    await loadTranslation(l);
    fetch("/api/users/language", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: l }) }).catch(() => {});
  };

  const availableLangs: LangMeta[] = [
    ...BUILTIN,
    ...customLangs.map((c) => ({ code: c.code, name: c.name, flag: c.flag })),
  ];

  return (
    <I18nContext.Provider value={{ lang, setLang, t: activeT, availableLangs, refreshLangs }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() { return useContext(I18nContext); }
export function useLang() { return useContext(I18nContext).lang; }
export function useT(): AnyTranslation { return useContext(I18nContext).t; }
