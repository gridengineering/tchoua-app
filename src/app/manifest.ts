import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tchoua — Tontines et associations",
    short_name: "Tchoua",
    description: "Gérez vos tontines, cotisations, prêts et associations sur tchoua.com.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3eb",
    theme_color: "#0d3d28",
    lang: "fr",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
