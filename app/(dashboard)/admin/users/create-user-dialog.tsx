"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Club, UserRole } from "@prisma/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Administrateur" },
  { value: "FEDERAL_ADMIN", label: "Administrateur Fédéral" },
  { value: "AGENT", label: "Agent" },
  { value: "CLUB_MANAGER", label: "Responsable de club" },
];

export function CreateUserDialog({ clubs }: { clubs: Pick<Club, "id" | "name">[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [clubId, setClubId] = useState("");
  const [password, setPassword] = useState("");

  function reset() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("");
    setClubId("");
    setPassword("");
  }

  async function create() {
    if (!email || !firstName || !lastName || !role || !password) {
      toast.error("Veuillez remplir tous les champs requis.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          role,
          clubId: role === "CLUB_MANAGER" ? clubId : undefined,
          password,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Une erreur est survenue.");
      }
      toast.success("Utilisateur créé.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nouvel utilisateur
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v: string | null) => setRole((v as UserRole) ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role === "CLUB_MANAGER" && (
            <div className="space-y-2">
              <Label>Club</Label>
              <Select value={clubId} onValueChange={(v: string | null) => setClubId(v ?? "")}>
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
          <div className="space-y-2">
            <Label>Mot de passe temporaire</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={create} disabled={submitting}>
            {submitting ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
