import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { listUsers } from "@/lib/modules/users/service";
import { listClubOptions } from "@/lib/modules/clubs/service";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateUserDialog } from "./create-user-dialog";
import { UserStatusToggle } from "./user-status-toggle";

export default async function UsersPage() {
  const user = await requireSessionUser();
  if (!can(user, "users.manage")) {
    redirect("/dashboard");
  }

  const [users, clubs] = await Promise.all([listUsers(user), listClubOptions(user)]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserDialog clubs={clubs} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.firstName} {u.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{ROLE_LABELS[u.role]}</TableCell>
                <TableCell className="text-muted-foreground">{u.club?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.status === "ACTIVE" ? "default" : "outline"}>
                    {u.status === "ACTIVE"
                      ? "Actif"
                      : u.status === "SUSPENDED"
                        ? "Suspendu"
                        : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {u.id !== user.id && <UserStatusToggle userId={u.id} status={u.status} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
