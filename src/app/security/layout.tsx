import type { Metadata } from "next";
import { headers } from "next/headers";
import { PUBLIC_PAGES, publicPageMetadata, type SeoLanguage } from "@/lib/seo";

const seo = PUBLIC_PAGES.find((item) => item.path === "/security")!;

export async function generateMetadata(): Promise<Metadata> {
  const language = ((await headers()).get("x-tchoua-lang") || "fr") as SeoLanguage;
  return publicPageMetadata(seo, language);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
