import type { PublicLang } from "./public-copy";

export type PresentationVideo = {
  src: string;
  poster: string;
  captions: string;
  lang: PublicLang;
  badge: string;
  title: string;
  desc: string;
  note: string;
};

export const PRESENTATION_VIDEOS: Record<PublicLang, PresentationVideo> = {
  fr: {
    src: "/videos/tchoua-presentation-fr.mp4",
    poster: "/videos/tchoua-presentation-fr.jpg",
    captions: "/videos/tchoua-presentation-fr.vtt",
    lang: "fr",
    badge: "Découvrir Tchoua",
    title: "Tchoua en 2 minutes",
    desc: "La tontine traditionnelle, digitalisée : associations, cotisations, sessions, prêts, solidarité et transparence.",
    note: "Vidéo avec voix off et sous-titres · 2 min",
  },
  en: {
    src: "/videos/tchoua-presentation-en.mp4",
    poster: "/videos/tchoua-presentation-en.jpg",
    captions: "/videos/tchoua-presentation-en.vtt",
    lang: "en",
    badge: "Discover Tchoua",
    title: "Tchoua in 2 minutes",
    desc: "Traditional tontine, digitized: associations, contributions, sessions, loans, solidarity and transparency.",
    note: "Narrated video with captions · 2 min",
  },
  es: {
    src: "/videos/tchoua-presentation-es.mp4",
    poster: "/videos/tchoua-presentation-es.jpg",
    captions: "/videos/tchoua-presentation-es.vtt",
    lang: "es",
    badge: "Descubre Tchoua",
    title: "Tchoua en 2 minutos",
    desc: "La tontina tradicional, digitalizada: asociaciones, aportes, sesiones, préstamos, solidaridad y transparencia.",
    note: "Vídeo narrado con subtítulos · 2 min",
  },
  de: {
    src: "/videos/tchoua-presentation-de.mp4",
    poster: "/videos/tchoua-presentation-de.jpg",
    captions: "/videos/tchoua-presentation-de.vtt",
    lang: "de",
    badge: "Tchoua entdecken",
    title: "Tchoua in 2 Minuten",
    desc: "Traditionelle Tontine, digitalisiert: Vereine, Beiträge, Sitzungen, Kredite, Solidarität und Transparenz.",
    note: "Video mit Off-Stimme und Untertiteln · 2 Min.",
  },
};
