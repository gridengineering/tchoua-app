"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { MemberSidebar } from "./member-sidebar";
import { MemberTopbar } from "./member-topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("tchoua_sidebar_collapsed") === "1");
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") router.push("/login");
  }, [mounted, status, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("tchoua_sidebar_collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Chargement de l&apos;espace</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as { name?: string | null; email?: string | null; systemRoleId?: string | null } | undefined;

  return (
    <div className="member-shell min-h-screen bg-slate-50">
      <MemberSidebar
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
      />
      <div className={`min-h-screen transition-[margin] duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <MemberTopbar title={title} onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
