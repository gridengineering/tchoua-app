"use client";

import { Building2 } from "lucide-react";

export type FilterAssociation = { id: string; name: string; color?: string | null };

interface Props {
  associations: FilterAssociation[];
  value: string; // "" = toutes
  onChange: (id: string) => void;
  className?: string;
}

export function AssociationFilter({ associations, value, onChange, className }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Building2 className="w-4 h-4 text-ash" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm bg-warm-white focus:outline-none focus:ring-2 focus:ring-[#0d3d28]"
        style={{ border: "1px solid #e2ddd4", minWidth: 220 }}
      >
        <option value="">Toutes mes associations ({associations.length})</option>
        {associations.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}
