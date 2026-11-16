import type { Metadata } from "next";
import { headers } from "next/headers";
import { PUBLIC_PAGES, publicPageMetadata, type SeoLanguage } from "@/lib/seo";
import { PublicHeader, PublicFooter } from "@/components/layout/public-layout";

const seo = PUBLIC_PAGES.find((item) => item.path === "/academie")!;

export async function generateMetadata(): Promise<Metadata> {
  const language = ((await headers()).get("x-tchoua-lang") || "fr") as SeoLanguage;
  return publicPageMetadata(seo, language);
}

export default function AcademieLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f3eb" }}>
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
