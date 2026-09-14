"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Season } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<Season["status"], string> = {
  UPCOMING: "À venir",
  ACTIVE: "En cours",
  CLOSED: "Clôturée",
};

export function SeasonsPanel({
  seasons,
  canManage,
}: {
  seasons: Season[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!name.trim() || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la création.");
      }
      toast.success("Saison créée.");
      setName("");
      setStartDate("");
      setEndDate("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setCurrent(season: Season) {
    try {
      const response = await fetch(`/api/seasons/${season.id}/current`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la mise à jour.");
      }
      toast.success(`${season.name} est maintenant la saison courante.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>Nom</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2027-2028"
              className="w-32"
            />
          </div>
          <div className="space-y-1">
            <Label>Début</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Fin</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button onClick={create} disabled={submitting}>
            Créer la saison
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Saison</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasons.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Aucune saison configurée.
                </TableCell>
              </TableRow>
            )}
            {seasons.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.name}
                  {s.isCurrent && (
                    <Badge className="ml-2" variant="secondary">
                      Courante
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(s.startDate).toLocaleDateString("fr-FR")} —{" "}
                  {new Date(s.endDate).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[s.status]}</Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {!s.isCurrent && (
                      <Button variant="ghost" size="sm" onClick={() => setCurrent(s)}>
                        Définir comme courante
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
