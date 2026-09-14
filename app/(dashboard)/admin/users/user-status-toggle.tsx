"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function UserStatusToggle({ userId, status }: { userId: string; status: UserStatus }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const nextStatus: UserStatus = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

  async function toggle() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success(nextStatus === "SUSPENDED" ? "Compte suspendu." : "Compte réactivé.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={submitting}>
      {status === "SUSPENDED" ? "Réactiver" : "Suspendre"}
    </Button>
  );
}
