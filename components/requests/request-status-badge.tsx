import { Badge } from "@/components/ui/badge";
import type { RequestStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<RequestStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-info/10 text-info border-info/20",
  UNDER_REVIEW: "bg-info/10 text-info border-info/20",
  CORRECTION_REQUESTED: "bg-warning/10 text-warning border-warning/20",
  PAYMENT_PENDING: "bg-warning/10 text-warning border-warning/20",
  PAYMENT_VERIFICATION: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
};

const LABELS: Record<RequestStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumise",
  UNDER_REVIEW: "En vérification",
  CORRECTION_REQUESTED: "À corriger",
  PAYMENT_PENDING: "Paiement en attente",
  PAYMENT_VERIFICATION: "Paiement à vérifier",
  APPROVED: "Validée",
  REJECTED: "Rejetée",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
