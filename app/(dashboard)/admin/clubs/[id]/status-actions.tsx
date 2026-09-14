"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ClubStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ClubStatusActions({
  clubId,
  status,
}: {
  clubId: string;
  status: ClubStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextStatus: ClubStatus = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  const isSuspending = nextStatus === "SUSPENDED";

  async function confirm() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success(
        isSuspending ? "Club suspendu." : "Club réactivé.",
      );
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={isSuspending ? "destructive" : "secondary"} />}
      >
        {isSuspending ? "Suspendre" : "Réactiver"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSuspending
              ? "Suspendre ce club ?"
              : "Réactiver ce club ?"}
          </DialogTitle>
          <DialogDescription>
            Cette action sera enregistrée dans le journal d&apos;audit.
            {isSuspending &&
              " Les responsables de ce club ne pourront plus soumettre de nouvelles demandes."}
          </DialogDescription>
        </DialogHeader>
        {isSuspending && (
          <div className="space-y-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant={isSuspending ? "destructive" : "default"}
            onClick={confirm}
            disabled={submitting}
          >
            {submitting ? "Confirmation..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
