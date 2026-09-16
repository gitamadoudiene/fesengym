"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CardOrder } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<CardOrder["status"], string> = {
  REQUESTED: "Commande reçue",
  PRINTING: "En impression",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export function CardOrderSection({
  licenseId,
  latestOrder,
  canOrder,
}: {
  licenseId: string;
  latestOrder: CardOrder | null;
  canOrder: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const hasActiveOrder =
    latestOrder && ["REQUESTED", "PRINTING", "SHIPPED"].includes(latestOrder.status);

  async function order() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/card-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Carte physique commandée.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (latestOrder) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Carte physique</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{STATUS_LABELS[latestOrder.status]}</Badge>
          {canOrder && !hasActiveOrder && (
            <Button size="sm" variant="secondary" onClick={order} disabled={submitting}>
              Commander à nouveau
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!canOrder) return null;

  return (
    <Button variant="secondary" onClick={order} disabled={submitting}>
      {submitting ? "Commande..." : "Commander la carte physique"}
    </Button>
  );
}
