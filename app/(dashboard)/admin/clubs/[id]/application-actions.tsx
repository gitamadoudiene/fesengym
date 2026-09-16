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

export function ClubApplicationActions({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function approve() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clubs/${clubId}/approve`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Adhésion validée. Le club est maintenant actif.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      toast.error("Le motif est requis.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clubs/${clubId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Adhésion refusée.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={approve} disabled={submitting}>
        Valider l&apos;adhésion
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="destructive" />}>Refuser</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser cette demande d&apos;adhésion ?</DialogTitle>
            <DialogDescription>
              Le club sera notifié du motif. Cette action sera enregistrée
              dans l&apos;historique.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motif du refus"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={reject} disabled={submitting}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
