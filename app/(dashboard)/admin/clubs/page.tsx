import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/dal";
import { isAdminRole } from "@/lib/auth/permissions";
import { listClubs } from "@/lib/modules/clubs/service";
import { listClubsQuerySchema } from "@/lib/modules/clubs/schema";
import { ClubStatusBadge } from "@/components/clubs/club-status-badge";
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
import { redirect } from "next/navigation";

export default async function ClubsListPage({
  searchParams,
}: PageProps<"/admin/clubs">) {
  const user = await requireSessionUser();
  if (!isAdminRole(user.role)) {
    redirect("/club/profile");
  }

  const params = await searchParams;
  const query = listClubsQuerySchema.parse({
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { items, total, page, pageSize } = await listClubs(user, query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Clubs
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} club{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/admin/clubs/new" />}>
          <Plus className="h-4 w-4" />
          Nouveau club
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Tous", value: undefined },
          { label: "En attente d'adhésion", value: "PENDING" },
          { label: "Actifs", value: "ACTIVE" },
          { label: "Suspendus", value: "SUSPENDED" },
          { label: "Refusés", value: "REJECTED" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/clubs?status=${f.value}` : "/admin/clubs"}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              query.status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form className="flex gap-2" action="/admin/clubs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Rechercher un club, une ville..."
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
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Athlètes</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <p className="font-medium text-foreground">
                    Aucun club trouvé
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aucun club ne correspond à vos critères.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {items.map((club) => (
              <TableRow key={club.id} className="cursor-pointer hover:bg-accent/40">
                <TableCell>
                  <Link href={`/admin/clubs/${club.id}`} className="font-mono text-xs text-muted-foreground">
                    {club.code}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/clubs/${club.id}`} className="font-medium text-foreground hover:underline">
                    {club.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {club.city ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {club._count.athletes}
                </TableCell>
                <TableCell>
                  <ClubStatusBadge status={club.status} />
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
