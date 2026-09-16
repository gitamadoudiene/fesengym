"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ code: string } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/club-applications", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      const club = await response.json();
      setSubmitted(club);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="font-heading text-lg font-bold text-foreground">
            Demande envoyée
          </p>
          <p className="text-sm text-muted-foreground">
            Votre demande d&apos;adhésion (référence {submitted.code}) a été
            transmise à l&apos;administration fédérale. Vous pouvez dès à
            présent vous connecter pour suivre son statut.
          </p>
          <Button className="mt-2" onClick={() => router.push("/login")}>
            Se connecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              01 · Le club
            </h2>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du club *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acronym">Sigle</Label>
                <Input id="acronym" name="acronym" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input id="phone" name="phone" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input id="city" name="city" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Région *</Label>
                <Input id="region" name="region" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presidentName">Nom du président *</Label>
              <Input id="presidentName" name="presidentName" required />
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              02 · Votre compte (responsable du club)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerFirstName">Prénom *</Label>
                <Input id="managerFirstName" name="managerFirstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerLastName">Nom *</Label>
                <Input id="managerLastName" name="managerLastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              03 · Documents justificatifs
            </h2>
            <p className="text-xs text-muted-foreground">
              PDF, JPEG, PNG ou WebP, 10 Mo maximum par fichier.
            </p>
            <div className="space-y-2">
              <Label htmlFor="statuts">Statuts de l&apos;association</Label>
              <Input id="statuts" name="statuts" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recepisse">Récépissé de déclaration</Label>
              <Input id="recepisse" name="recepisse" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listeBureau">Liste des membres du bureau</Label>
              <Input id="listeBureau" name="listeBureau" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
            </div>
          </section>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Envoi en cours..." : "Soumettre la demande d'adhésion"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
