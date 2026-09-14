"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Actions = {
  canSubmit: boolean;
  canStartReview: boolean;
  canDecide: boolean;
  canRequestCorrection: boolean;
};

async function postAction(url: string) {
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Une erreur est survenue.");
  }
  return response.json();
}

export function RequestActions({ requestId, actions }: { requestId: string; actions: Actions }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<"reject" | "correction" | null>(null);
  const [reason, setReason] = useState("");

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setSubmitting(true);
    try {
      await action();
      toast.success(successMessage);
      router.refresh();
      setReasonDialog(null);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReasonAction() {
    if (!reason.trim()) {
      toast.error("Le motif est requis.");
      return;
    }
    const endpoint =
      reasonDialog === "reject" ? "reject" : "correction";
    await run(
      () =>
        fetch(`/api/requests/${requestId}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }).then((r) => {
          if (!r.ok) return r.json().then((b) => Promise.reject(new Error(b?.error)));
          return r.json();
        }),
      reasonDialog === "reject" ? "Demande rejetée." : "Correction demandée.",
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.canSubmit && (
        <Button
          disabled={submitting}
          onClick={() => run(() => postAction(`/api/requests/${requestId}/submit`), "Demande soumise.")}
        >
          Soumettre la demande
        </Button>
      )}

      {actions.canStartReview && (
        <Button
          disabled={submitting}
          variant="secondary"
          onClick={() => run(() => postAction(`/api/requests/${requestId}/review`), "Vérification démarrée.")}
        >
          Commencer la vérification
        </Button>
      )}

      {actions.canRequestCorrection && (
        <Dialog open={reasonDialog === "correction"} onOpenChange={(o) => setReasonDialog(o ? "correction" : null)}>
          <DialogTrigger render={<Button variant="secondary" />}>
            Demander une correction
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demander une correction</DialogTitle>
              <DialogDescription>
                Le club sera notifié et pourra corriger puis resoumettre la demande.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motif de la correction (ex: certificat médical expiré)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setReasonDialog(null)}>
                Annuler
              </Button>
              <Button onClick={submitReasonAction} disabled={submitting}>
                Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {actions.canDecide && (
        <>
          <Button
            disabled={submitting}
            onClick={() => run(() => postAction(`/api/requests/${requestId}/approve`), "Demande validée, licence délivrée.")}
          >
            Valider
          </Button>
          <Dialog open={reasonDialog === "reject"} onOpenChange={(o) => setReasonDialog(o ? "reject" : null)}>
            <DialogTrigger render={<Button variant="destructive" />}>Rejeter</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Êtes-vous sûr de vouloir rejeter cette demande ?</DialogTitle>
                <DialogDescription>
                  Cette action sera enregistrée dans l&apos;historique.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Motif du rejet"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setReasonDialog(null)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={submitReasonAction} disabled={submitting}>
                  Confirmer le rejet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
