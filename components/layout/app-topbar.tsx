import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@prisma/client";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppTopbar({
  name,
  role,
}: {
  name: string;
  role: UserRole;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="md:hidden font-heading text-sm font-semibold text-foreground">
        FSG Gestion
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight text-foreground">
            {name}
          </p>
          <p className="text-xs leading-tight text-muted-foreground">
            {ROLE_LABELS[role]}
          </p>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-accent text-accent-foreground">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button variant="ghost" size="icon" type="submit" title="Déconnexion">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
