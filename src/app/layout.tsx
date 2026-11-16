import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PUBLIC_PAGES, SITE_URL, languageAlternates, publicPageMetadata, type SeoLanguage } from "@/lib/seo";

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tchoua — Gestion de tontines et d’associations en Afrique",
    template: "%s | Tchoua",
  },
  description:
    "Tchoua digitalise les tontines et associations : cotisations, prêts, solidarité, gouvernance, rapports et mobile money. Gratuit et open source.",
  keywords: [
    "tontine",
    "tontines",
    "association",
    "gestion tontine",
    "application tontine",
    "Cameroun",
    "Afrique",
    "mobile money",
    "prêts communautaires",
    "solidarité",
    "open source",
  ],
  alternates: {
    canonical: SITE_URL,
    languages: languageAlternates("/"),
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Tchoua",
    title: "Tchoua — Gestion de tontines et d’associations en Afrique",
    description:
      "Digitalisez votre tontine : cotisations, prêts, solidarité, gouvernance et rapports. Gratuit et open source.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@stampolla",
    creator: "@stampolla",
    title: "Tchoua — Gestion de tontines et d’associations",
    description: "La solidarité, digitalisée. Gérez vos tontines et associations sur tchoua.com.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "QtqlmqkMVZ9N4KbFz6tGwqULIrDRXRhFjGXSzwBdkRU",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-tchoua-path") || "/";
  const language = ((requestHeaders.get("x-tchoua-lang") || "fr") as SeoLanguage);
  const seo = PUBLIC_PAGES.find((item) => item.path === pathname);
  return seo ? { ...baseMetadata, ...publicPageMetadata(seo, language) } : baseMetadata;
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Tchoua",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: ["https://github.com/gridengineering/tchoua-app", "https://x.com/stampolla"],
      contactPoint: { "@type": "ContactPoint", email: "contact@tchoua.com", contactType: "customer support" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Tchoua",
      inLanguage: ["fr", "en", "es", "de"],
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/templates?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600&family=Crimson+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-cream font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
