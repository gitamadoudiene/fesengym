"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [errorMessage, formAction, pending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="prenom.nom@fsg.sn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
