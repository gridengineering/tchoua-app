import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE_URL, languageAlternates } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PAGES.flatMap((page) => {
    const languages = languageAlternates(page.path);
    return (["fr", "en", "es", "de"] as const).map((lang) => ({
      url: languages[lang],
      lastModified,
      changeFrequency: page.path === "/" ? "weekly" : "monthly",
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
