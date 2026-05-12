"use client";

import React from "react";

interface Node {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

interface ArchitectureDiagramProps {
  nodes: Node[];
  edges: Edge[];
  height?: number;
}

export function ArchitectureDiagram({ nodes, edges, height = 500 }: ArchitectureDiagramProps) {
  return (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-[#e2ddd4] bg-white p-6" style={{ minHeight: height }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: height }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#0d3d28" />
          </marker>
          <marker id="arrowhead-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = nodes.find((n) => n.id === e.from);
          const b = nodes.find((n) => n.id === e.to);
          if (!a || !b) return null;
          const x1 = a.x + a.w / 2;
          const y1 = a.y + a.h / 2;
          const x2 = b.x + b.w / 2;
          const y2 = b.y + b.h / 2;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={e.dashed ? "#999" : "#0d3d28"}
                strokeWidth={2}
                strokeDasharray={e.dashed ? "6,4" : undefined}
                markerEnd={`url(#arrowhead${e.dashed ? "-dashed" : ""})`}
              />
              {e.label && (
                <rect x={mx - 40} y={my - 10} width={80} height={20} rx={4} fill="#f7f3eb" />
              )}
              {e.label && (
                <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fill="#0d3d28" fontWeight={600}>
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="relative" style={{ minHeight: height }}>
        {nodes.map((n) => (
          <div
            key={n.id}
            className="absolute flex flex-col items-center justify-center rounded-xl border-2 shadow-sm text-center px-2"
            style={{
              left: n.x,
              top: n.y,
              width: n.w,
              height: n.h,
              borderColor: n.color,
              backgroundColor: n.color + "15",
            }}
          >
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: n.color }}>
              {n.label}
            </span>
            {n.sublabel && (
              <span className="text-[10px] font-medium mt-0.5 opacity-70" style={{ color: n.color }}>
                {n.sublabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
