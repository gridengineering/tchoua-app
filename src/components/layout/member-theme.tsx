"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_MEMBER_THEME, isMemberTheme, MemberThemeId } from "@/lib/member-themes";

type ThemeCtx = {
  theme: MemberThemeId;
  setTheme: (id: MemberThemeId) => void;
  ready: boolean;
};

const Ctx = createContext<ThemeCtx>({ theme: DEFAULT_MEMBER_THEME, setTheme: () => {}, ready: false });

const THEME_EVENT = "tchoua-member-theme-change";

function applyTheme(id: MemberThemeId) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-member-theme", id);
  }
}

export function applyMemberTheme(id: MemberThemeId) {
  if (!isMemberTheme(id)) return;
  applyTheme(id);
  try {
    localStorage.setItem("tchoua_member_theme", id);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: id }));
  } catch {}
  fetch("/api/users/theme", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme: id }),
  }).catch(() => {});
}

export function MemberThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<MemberThemeId>(DEFAULT_MEMBER_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onTheme = (event: Event) => {
      const id = (event as CustomEvent).detail;
      if (isMemberTheme(id)) setThemeState(id);
    };
    window.addEventListener(THEME_EVENT, onTheme);
    const stored = localStorage.getItem("tchoua_member_theme");
    const initial = isMemberTheme(stored) ? stored : DEFAULT_MEMBER_THEME;
    setThemeState(initial);
    applyTheme(initial);
    setReady(true);

    fetch("/api/users/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (isMemberTheme(d?.theme) && d.theme !== initial) {
          setThemeState(d.theme);
          applyTheme(d.theme);
          localStorage.setItem("tchoua_member_theme", d.theme);
        }
      })
      .catch(() => {});
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  const setTheme = useCallback((id: MemberThemeId) => {
    applyMemberTheme(id);
  }, []);

  return <Ctx.Provider value={{ theme, setTheme, ready }}>{children}</Ctx.Provider>;
}

export function useMemberTheme() {
  return useContext(Ctx);
}
