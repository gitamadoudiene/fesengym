"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LicenseStatus } from "@prisma/client";
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

export function LicenseActions({ licenseId, status }: { licenseId: string; status: LicenseStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function suspend() {
    if (!reason.trim()) {
      toast.error("Le motif est requis.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/licenses/${licenseId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Licence suspendue.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function reactivate() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/licenses/${licenseId}/reactivate`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Licence réactivée.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "SUSPENDED") {
    return (
      <Button variant="secondary" onClick={reactivate} disabled={submitting}>
        Réactiver
      </Button>
    );
  }

  if (status !== "ACTIVE") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Suspendre</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspendre cette licence ?</DialogTitle>
          <DialogDescription>
            Cette action sera enregistrée dans l&apos;historique. L&apos;athlète
            ne sera plus considéré comme licencié tant que la suspension est active.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Motif de la suspension"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={suspend} disabled={submitting}>
            Confirmer la suspension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
