"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Athlete, Category, Discipline, RequestType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AthleteOption = Pick<Athlete, "id" | "firstName" | "lastName">;
type CategoryOption = Category & { discipline: { id: string } | null };

export function RequestForm({
  athletes,
  disciplines,
  categories,
  seasonId,
  preselectedAthleteId,
  preselectedOriginLicenseId,
  type,
}: {
  athletes: AthleteOption[];
  disciplines: Discipline[];
  categories: CategoryOption[];
  seasonId: string;
  preselectedAthleteId?: string;
  preselectedOriginLicenseId?: string;
  type: RequestType;
}) {
  const router = useRouter();
  const [athleteId, setAthleteId] = useState(preselectedAthleteId ?? "");
  const [disciplineId, setDisciplineId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter(
    (c) => !c.discipline || !disciplineId || c.discipline.id === disciplineId,
  );

  async function onSubmit() {
    if (!athleteId || !disciplineId || !categoryId) {
      toast.error("Veuillez renseigner l'athlète, la discipline et la catégorie.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          seasonId,
          disciplineId,
          categoryId,
          type,
          originLicenseId: preselectedOriginLicenseId,
          notes: notes || undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      const request = await response.json();
      toast.success("Demande créée. Vous pouvez maintenant enregistrer le paiement.");
      router.push(`/requests/${request.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label>01 · Athlète *</Label>
          <Select
            value={athleteId}
            onValueChange={(v: string | null) => setAthleteId(v ?? "")}
            disabled={!!preselectedAthleteId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un athlète" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.lastName} {a.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>02 · Discipline *</Label>
            <Select value={disciplineId} onValueChange={(v: string | null) => setDisciplineId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner" />
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
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={categoryId} onValueChange={(v: string | null) => setCategoryId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">03 · Notes (optionnel)</Label>
          <Textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Le prix de la licence sera affiché à l&apos;étape suivante, avec
          l&apos;enregistrement du paiement.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Création..." : "Continuer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
