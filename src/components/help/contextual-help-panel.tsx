"use client";

import { BookOpen, ExternalLink, GraduationCap, HelpCircle, X } from "lucide-react";
import type { ContextualHelpEntry } from "@/lib/help/contextual-help";
import { manualUrl, studyUrl } from "@/lib/help/contextual-help";

export function ContextualHelpPanel({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: ContextualHelpEntry;
}) {
  return (
    <>
      {open && (
        <button
          aria-label="Fermer l’aide"
          onClick={onClose}
          className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <aside
        aria-label="Aide contextuelle"
        aria-hidden={!open}
        className={`fixed bottom-0 right-0 top-16 z-50 flex w-[92vw] max-w-sm flex-col border-l shadow-2xl transition-transform duration-300 lg:w-64 lg:max-w-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--m-surface, #ffffff)",
          borderColor: "var(--m-border, #e2e8f0)",
          color: "var(--m-text, #0f172a)",
        }}
      >
        <div
          className="flex flex-none items-start gap-3 border-b px-4 py-4"
          style={{ borderColor: "var(--m-border, #e2e8f0)" }}
        >
          <div
            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
            style={{ background: "var(--m-accent, #0d3d28)", color: "var(--m-accent-contrast, #ffffff)" }}
          >
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-50">Aide contextuelle</div>
            <h2 className="mt-0.5 text-sm font-bold leading-snug">{entry.title}</h2>
            <p className="mt-0.5 text-[11px] leading-snug opacity-55">{entry.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 opacity-50 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--m-border, #e2e8f0)", background: "var(--m-soft, #f8fafc)" }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] opacity-60">
              <BookOpen className="h-3 w-3" /> Manuel · {entry.manualAnchor.replace("ch", "chapitre ")}
            </div>
            <div className="mt-1 text-xs font-bold leading-snug">{entry.manualTitle}</div>
            <p className="mt-2 text-[11.5px] leading-relaxed opacity-75">{entry.manualExcerpt}</p>
            <a
              href={manualUrl(entry)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold"
              style={{ color: "var(--m-accent, #0d3d28)" }}
            >
              Ouvrir la section du manuel <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mt-5">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-45">Formulaire</div>
            <div className="mt-1 text-xs font-bold">{entry.formName}</div>
            <div className="mt-2 space-y-2">
              {entry.fields.map((f) => (
                <div key={f.name} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--m-border, #e2e8f0)" }}>
                  <div className="text-[11.5px] font-bold">{f.name}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-65">{f.help}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-45">Étapes</div>
            <ol className="mt-2 space-y-1.5">
              {entry.steps.map((s, i) => (
                <li key={s} className="flex gap-2 text-[11.5px] leading-relaxed">
                  <span
                    className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9px] font-black"
                    style={{ background: "var(--m-accent-soft, rgba(13,61,40,.1))", color: "var(--m-accent, #0d3d28)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="opacity-75">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {entry.tips.length > 0 && (
            <div className="mt-5 rounded-xl border p-3" style={{ borderColor: "var(--m-border, #e2e8f0)" }}>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-45">À savoir</div>
              <ul className="mt-2 space-y-1.5">
                {entry.tips.map((t) => (
                  <li key={t} className="text-[11px] leading-relaxed opacity-70">• {t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--m-border, #e2e8f0)" }}>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-45">Pour aller plus loin</div>
            <div className="mt-2 flex flex-col gap-2">
              {entry.studyAnchor && (
                <a
                  href={studyUrl(entry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-opacity hover:opacity-80"
                  style={{ borderColor: "var(--m-border, #e2e8f0)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="min-w-0">
                    <span className="block">Étude technique</span>
                    <span className="block text-[10px] font-normal opacity-55">{entry.studyTitle}</span>
                  </span>
                </a>
              )}
              <a
                href="/academie"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-opacity hover:opacity-80"
                style={{ borderColor: "var(--m-border, #e2e8f0)" }}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>
                  <span className="block">Académie Tchoua</span>
                  <span className="block text-[10px] font-normal opacity-55">Tutoriels et parcours guidés</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
