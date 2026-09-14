"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Payment, PaymentMethod } from "@prisma/client";

export type SerializedPayment = Omit<Payment, "amount"> & { amount: string };
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  BANK_TRANSFER: "Virement bancaire",
  CARD: "Carte",
  OTHER: "Autre",
};

const PAYMENT_STATUS_LABELS: Record<Payment["status"], string> = {
  PENDING: "En attente",
  PAID: "Déclaré — à vérifier",
  VERIFIED: "Vérifié",
  FAILED: "Échoué",
  REJECTED: "Rejeté",
  REFUNDED: "Remboursé",
};

export function PaymentSection({
  requestId,
  payment,
  amountHint,
  canRecord,
  canVerify,
}: {
  requestId: string;
  payment: SerializedPayment | null;
  amountHint: { amount: string; currency: string } | null;
  canRecord: boolean;
  canVerify: boolean;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function record() {
    if (!method) {
      toast.error("Veuillez choisir une méthode de paiement.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseRequestId: requestId,
          method,
          transactionReference: transactionReference || undefined,
          notes: notes || undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Paiement enregistré.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(decision: "VERIFIED" | "REJECTED") {
    if (!payment) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/payments/${payment.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success(decision === "VERIFIED" ? "Paiement vérifié." : "Paiement rejeté.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!payment) {
    if (!canRecord) {
      return <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>;
    }
    return (
      <div className="space-y-4">
        {amountHint && (
          <p className="text-sm">
            Montant à régler :{" "}
            <span className="font-semibold text-foreground">
              {amountHint.amount} {amountHint.currency}
            </span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Méthode *</Label>
            <Select value={method} onValueChange={(v: string | null) => setMethod((v as PaymentMethod) ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactionReference">Référence transaction</Label>
            <Input
              id="transactionReference"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-notes">Notes</Label>
          <Input id="payment-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button onClick={record} disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer le paiement"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Référence</span>
        <span className="font-mono text-xs">{payment.reference}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Montant</span>
        <span className="font-medium">
          {payment.amount} {payment.currency}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Méthode</span>
        <span>{METHOD_LABELS[payment.method]}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Statut</span>
        <Badge variant="outline">{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
      </div>

      {canVerify && payment.status === "PAID" && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={() => verify("VERIFIED")} disabled={submitting}>
            Vérifier
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => verify("REJECTED")}
            disabled={submitting}
          >
            Rejeter
          </Button>
        </div>
      )}
    </div>
  );
}
