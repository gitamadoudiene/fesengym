"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Category, Discipline } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryWithDiscipline = Category & {
  discipline: Pick<Discipline, "id" | "name" | "code"> | null;
};

export function CategoriesPanel({
  categories,
  disciplines,
  canManage,
}: {
  categories: CategoryWithDiscipline[];
  disciplines: Discipline[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [disciplineId, setDisciplineId] = useState<string>("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          disciplineId: disciplineId || undefined,
          minAge: minAge ? Number(minAge) : undefined,
          maxAge: maxAge ? Number(maxAge) : undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la création.");
      }
      toast.success("Catégorie créée.");
      setName("");
      setDisciplineId("");
      setMinAge("");
      setMaxAge("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(category: Category) {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !category.active }),
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
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cadet" />
          </div>
          <div className="space-y-1">
            <Label>Discipline (optionnel)</Label>
            <Select value={disciplineId} onValueChange={(v) => setDisciplineId(v ?? "")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes disciplines" />
              </SelectTrigger>
              <SelectContent>
                {disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Âge min</Label>
            <Input
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="space-y-1">
            <Label>Âge max</Label>
            <Input
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="w-20"
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
              <TableHead>Nom</TableHead>
              <TableHead>Discipline</TableHead>
              <TableHead>Tranche d&apos;âge</TableHead>
              <TableHead>Statut</TableHead>
              {canManage && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucune catégorie configurée.
                </TableCell>
              </TableRow>
            )}
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.discipline?.name ?? "Toutes"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.minAge != null || c.maxAge != null
                    ? `${c.minAge ?? "—"} - ${c.maxAge ?? "—"} ans`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={c.active ? "default" : "outline"}>
                    {c.active ? "Active" : "Désactivée"}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
                      {c.active ? "Désactiver" : "Activer"}
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
