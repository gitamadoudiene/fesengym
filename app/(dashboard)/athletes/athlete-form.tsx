"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, User } from "lucide-react";
import {
  createAthleteSchema,
  type CreateAthleteInput,
} from "@/lib/modules/athletes/schema";
import type { Category, Club, Discipline } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type DuplicateMatch = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  club: { name: string };
};

type AthleteFormProps = {
  athleteId?: string;
  defaultValues?: Partial<CreateAthleteInput>;
  disciplines: Discipline[];
  categories: (Category & { discipline: { id: string } | null })[];
  clubs: Pick<Club, "id" | "name">[];
  requireClubSelect: boolean;
  existingPhotoUrl?: string;
};

export function AthleteForm({
  athleteId,
  defaultValues,
  disciplines,
  categories,
  clubs,
  requireClubSelect,
  existingPhotoUrl,
}: AthleteFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl ?? null);
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateAthleteInput>({
    resolver: zodResolver(createAthleteSchema),
    defaultValues: { nationality: "Sénégalaise", ...defaultValues },
  });

  const disciplineId = watch("disciplineId");
  const filteredCategories = categories.filter(
    (c) => !c.discipline || !disciplineId || c.discipline.id === disciplineId,
  );

  async function checkDuplicates() {
    const { firstName, lastName, dateOfBirth } = getValues();
    if (!firstName || !lastName) return;
    const params = new URLSearchParams({ firstName, lastName });
    if (dateOfBirth) params.set("dateOfBirth", dateOfBirth);
    const response = await fetch(`/api/athletes/duplicates?${params}`);
    if (response.ok) {
      setDuplicates(await response.json());
    }
  }

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(targetAthleteId: string) {
    if (!photoFile) return;
    const formData = new FormData();
    formData.append("ownerType", "ATHLETE");
    formData.append("ownerId", targetAthleteId);
    formData.append("type", "PHOTO");
    formData.append("file", photoFile);

    const uploadRes = await fetch("/api/documents", { method: "POST", body: formData });
    if (!uploadRes.ok) {
      const body = await uploadRes.json().catch(() => null);
      throw new Error(body?.error ?? "Échec de l'envoi de la photo.");
    }
    const document = await uploadRes.json();

    const linkRes = await fetch(`/api/athletes/${targetAthleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoDocumentId: document.id }),
    });
    if (!linkRes.ok) {
      throw new Error("La photo a été envoyée mais n'a pas pu être associée à l'athlète.");
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const response = await fetch(
        athleteId ? `/api/athletes/${athleteId}` : "/api/athletes",
        {
          method: athleteId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      const athlete = await response.json();

      if (photoFile) {
        await uploadPhoto(athlete.id);
      }

      toast.success(athleteId ? "Athlète mis à jour." : "Athlète créé avec succès.");
      router.push(`/athletes/${athlete.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {duplicates.length > 0 && (
          <div className="flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                Un athlète correspondant existe peut-être déjà.
              </p>
              <ul className="mt-1 space-y-0.5">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    {d.firstName} {d.lastName} —{" "}
                    {new Date(d.dateOfBirth).toLocaleDateString("fr-FR")} —{" "}
                    {d.club.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) ou document authentifié, pas un asset optimisable par next/image
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo">Photo de l&apos;athlète</Label>
              <Input id="photo" type="file" accept="image/*" onChange={onPhotoChange} />
              <p className="text-xs text-muted-foreground">
                Utilisée sur la carte de licence et la vérification publique.
              </p>
            </div>
          </div>

          {requireClubSelect && (
            <div className="space-y-2">
              <Label>Club *</Label>
              <Select onValueChange={(v: string | null) => setValue("clubId", v ?? undefined)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input id="firstName" {...register("firstName")} onBlur={checkDuplicates} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" {...register("lastName")} onBlur={checkDuplicates} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
                onBlur={checkDuplicates}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sexe *</Label>
              <Select onValueChange={(v) => setValue("sex", v as "M" | "F")} defaultValue="F">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Féminin</SelectItem>
                  <SelectItem value="M">Masculin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationalité</Label>
              <Input id="nationality" {...register("nationality")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...register("city")} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="space-y-2">
              <Label>Discipline</Label>
              <Select onValueChange={(v: string | null) => setValue("disciplineId", v ?? undefined)}>
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
              <Label>Catégorie</Label>
              <Select onValueChange={(v: string | null) => setValue("categoryId", v ?? undefined)}>
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

            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact d&apos;urgence</Label>
              <Input id="emergencyContactName" {...register("emergencyContactName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Téléphone d&apos;urgence</Label>
              <Input id="emergencyContactPhone" {...register("emergencyContactPhone")} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="medicalNotes">Informations médicales nécessaires au dossier</Label>
              <Textarea id="medicalNotes" rows={3} {...register("medicalNotes")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
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
