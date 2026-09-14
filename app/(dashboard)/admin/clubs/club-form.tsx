"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClubSchema, type CreateClubInput } from "@/lib/modules/clubs/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type ClubFormProps = {
  clubId?: string;
  defaultValues?: Partial<CreateClubInput>;
};

export function ClubForm({ clubId, defaultValues }: ClubFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClubInput>({
    resolver: zodResolver(createClubSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const response = await fetch(
        clubId ? `/api/clubs/${clubId}` : "/api/clubs",
        {
          method: clubId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }

      const club = await response.json();
      toast.success(clubId ? "Club mis à jour." : "Club créé avec succès.");
      router.push(`/admin/clubs/${club.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nom du club *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acronym">Sigle</Label>
              <Input id="acronym" {...register("acronym")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliationNumber">N° d&apos;affiliation</Label>
              <Input id="affiliationNumber" {...register("affiliationNumber")} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Input id="region" {...register("region")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerName">Responsable</Label>
              <Input id="managerName" {...register("managerName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presidentName">Président</Label>
              <Input id="presidentName" {...register("presidentName")} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes administratives</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
