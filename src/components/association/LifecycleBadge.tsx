"use client";

import { cn } from "@/lib/utils";

interface LifecycleBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  DRAFT: {
    label: "Brouillon",
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  },
  PENDING: {
    label: "En attente",
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  ACTIVE: {
    label: "Active",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  SUSPENDED: {
    label: "Suspendue",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  DISSOLVED: {
    label: "Dissoute",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function LifecycleBadge({ status }: LifecycleBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      data-testid="lifecycle-badge"
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        config.classes
      )}
    >
      {config.label}
    </span>
  );
}
