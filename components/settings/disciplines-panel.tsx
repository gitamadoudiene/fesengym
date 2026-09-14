"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Discipline } from "@prisma/client";
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

export function DisciplinesPanel({
  disciplines,
  canManage,
}: {
  disciplines: Discipline[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!code.trim() || !name.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/disciplines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la création.");
      }
      toast.success("Discipline créée.");
      setCode("");
      setName("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(discipline: Discipline) {
    try {
      const response = await fetch(`/api/disciplines/${discipline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !discipline.active }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="disc-code">Code</Label>
            <Input
              id="disc-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="GAF"
              className="w-24"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="disc-name">Nom</Label>
            <Input
              id="disc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gymnastique Artistique Féminine"
            />
          </div>
          <Button onClick={create} disabled={submitting}>
            Ajouter
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {disciplines.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Aucune discipline configurée.
                </TableCell>
              </TableRow>
            )}
            {disciplines.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.code}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>
                  <Badge variant={d.active ? "default" : "outline"}>
                    {d.active ? "Active" : "Désactivée"}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(d)}>
                      {d.active ? "Désactiver" : "Activer"}
                    </Button>
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
