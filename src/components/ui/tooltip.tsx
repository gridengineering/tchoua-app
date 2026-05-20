"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

interface TooltipProps {
  text: string;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
}

export function Tooltip({ text, title, position = "top", children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const posClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  return (
    <div ref={ref} className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 text-gray-400 hover:text-[#0d3d28] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3d28] rounded-sm"
        aria-label="Aide"
        title="Aide"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className={`absolute z-50 w-64 ${posClass}`}>
          <div className="rounded-xl shadow-xl border text-sm"
            style={{ background: "#0d3d28", borderColor: "rgba(212,163,67,0.3)" }}>
            <div className="flex items-start justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {title && <span className="font-semibold text-white text-xs">{title}</span>}
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-white/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
                aria-label="Fermer"
                title="Fermer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="px-3 py-2.5 text-white/80 text-xs leading-relaxed">{text}</p>
          </div>
          {/* Arrow */}
          <div className={`absolute w-2 h-2 rotate-45 ${position === "top" ? "top-full left-1/2 -translate-x-1/2 -mt-1" : position === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 mb-[-4px]" : ""}`}
            style={{ background: "#0d3d28" }} />
        </div>
      )}
    </div>
  );
}

// Inline help icon for form labels
export function HelpTooltip({ text, title }: { text: string; title?: string }) {
  return <Tooltip text={text} title={title} position="right" />;
}
