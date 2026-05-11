import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "forest" | "gold";
  className?: string;
}

const variants = {
  default: "bg-stone/30 text-graphite border border-stone/50",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  danger: "bg-error/10 text-error border border-error/20",
  info: "bg-info/10 text-info border border-info/20",
  purple: "bg-indigo/10 text-indigo border border-indigo/20",
  forest: "bg-forest/10 text-forest border border-forest/20",
  gold: "bg-gold/10 text-gold border border-gold/20",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    ACTIVE: { label: "Actif", variant: "success" },
    PENDING: { label: "En attente", variant: "warning" },
    PAID: { label: "Payé", variant: "success" },
    LATE: { label: "En retard", variant: "danger" },
    DEFAULTED: { label: "Défaut", variant: "danger" },
    COMPLETED: { label: "Terminé", variant: "info" },
    APPROVED: { label: "Approuvé", variant: "success" },
    REJECTED: { label: "Refusé", variant: "danger" },
    DISBURSED: { label: "Débloqué", variant: "info" },
    REPAYING: { label: "En remboursement", variant: "warning" },
    REPAID: { label: "Remboursé", variant: "success" },
    VALIDATED: { label: "Validé", variant: "success" },
    SUSPENDED: { label: "Suspendu", variant: "danger" },
    UPCOMING: { label: "À venir", variant: "purple" },
    CANCELLED: { label: "Annulé", variant: "default" },
  };

  const config = map[status] || { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
