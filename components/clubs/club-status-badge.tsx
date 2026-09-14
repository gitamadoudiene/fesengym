import { Badge } from "@/components/ui/badge";
import type { ClubStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<ClubStatus, string> = {
  ACTIVE: "bg-success/10 text-success border-success/20",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  SUSPENDED: "bg-destructive/10 text-destructive border-destructive/20",
};

const LABELS: Record<ClubStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
};

export function ClubStatusBadge({ status }: { status: ClubStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
