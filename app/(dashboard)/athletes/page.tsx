import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/dal";
import { isAdminRole } from "@/lib/auth/permissions";
import { listAthletes } from "@/lib/modules/athletes/service";
import { listAthletesQuerySchema } from "@/lib/modules/athletes/schema";
import { AthleteStatusBadge } from "@/components/athletes/athlete-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AthletesListPage({
  searchParams,
}: PageProps<"/athletes">) {
  const user = await requireSessionUser();
  const params = await searchParams;

  const query = listAthletesQuerySchema.parse({
    search: typeof params.search === "string" ? params.search : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { items, total, page, pageSize } = await listAthletes(user, query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Athlètes
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} athlète{total > 1 ? "s" : ""}
            {isAdminRole(user.role) ? " (toutes fédérations)" : " de votre club"}
          </p>
        </div>
        <Button render={<Link href="/athletes/new" />}>
          <Plus className="h-4 w-4" />
          Nouvel athlète
        </Button>
      </div>

      <form className="flex gap-2" action="/athletes">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Nom, prénom, numéro fédéral..."
            defaultValue={query.search}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              {isAdminRole(user.role) && <TableHead>Club</TableHead>}
              <TableHead>Discipline</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <p className="font-medium text-foreground">
                    Aucun athlète trouvé
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aucun athlète ne correspond à vos critères.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {items.map((athlete) => (
              <TableRow key={athlete.id} className="hover:bg-accent/40">
                <TableCell>
                  <Link
                    href={`/athletes/${athlete.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {athlete.lastName} {athlete.firstName}
                  </Link>
                </TableCell>
                {isAdminRole(user.role) && (
                  <TableCell className="text-muted-foreground">
                    {athlete.club.name}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  {athlete.discipline?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {athlete.category?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <AthleteStatusBadge status={athlete.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          Page {page} / {totalPages}
        </div>
      )}
    </div>
  );
}
