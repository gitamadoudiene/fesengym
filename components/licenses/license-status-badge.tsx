import { Badge } from "@/components/ui/badge";
import type { LicenseStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<LicenseStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  PENDING: "bg-info/10 text-info border-info/20",
  UNDER_REVIEW: "bg-info/10 text-info border-info/20",
  APPROVED: "bg-info/10 text-info border-info/20",
  ACTIVE: "bg-success/10 text-success border-success/20",
  EXPIRED: "bg-destructive/10 text-destructive border-destructive/20",
  SUSPENDED: "bg-warning/10 text-warning border-warning/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
};

const LABELS: Record<LicenseStatus, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  UNDER_REVIEW: "En vérification",
  APPROVED: "Validée",
  ACTIVE: "Active",
  EXPIRED: "Expirée",
  SUSPENDED: "Suspendue",
  CANCELLED: "Annulée",
  REJECTED: "Rejetée",
};

export function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
