import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/dal";
import { isAdminRole } from "@/lib/auth/permissions";
import { listRequests } from "@/lib/modules/licenseRequests/service";
import { listRequestsQuerySchema } from "@/lib/modules/licenseRequests/schema";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RequestsListPage({
  searchParams,
}: PageProps<"/requests">) {
  const user = await requireSessionUser();
  const params = await searchParams;

  const query = listRequestsQuerySchema.parse({
    status: typeof params.status === "string" ? params.status : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { items, total, page, pageSize } = await listRequests(user, query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Demandes de licence
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} demande{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/requests/new" />}>
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusFilterLink label="Toutes" status={undefined} current={query.status} />
        <StatusFilterLink label="Soumises" status="SUBMITTED" current={query.status} />
        <StatusFilterLink label="En vérification" status="UNDER_REVIEW" current={query.status} />
        <StatusFilterLink label="À corriger" status="CORRECTION_REQUESTED" current={query.status} />
        <StatusFilterLink label="Validées" status="APPROVED" current={query.status} />
        <StatusFilterLink label="Rejetées" status="REJECTED" current={query.status} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Athlète</TableHead>
              {isAdminRole(user.role) && <TableHead>Club</TableHead>}
              <TableHead>Saison</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <p className="font-medium text-foreground">Aucune demande trouvée</p>
                  <p className="text-sm text-muted-foreground">
                    Aucune demande ne correspond à vos critères.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {items.map((r) => (
              <TableRow key={r.id} className="hover:bg-accent/40">
                <TableCell>
                  <Link href={`/requests/${r.id}`} className="font-mono text-xs text-foreground hover:underline">
                    {r.number}
                  </Link>
                </TableCell>
                <TableCell>
                  {r.athlete.firstName} {r.athlete.lastName}
                </TableCell>
                {isAdminRole(user.role) && (
                  <TableCell className="text-muted-foreground">{r.club.name}</TableCell>
                )}
                <TableCell className="text-muted-foreground">{r.season.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.type}</TableCell>
                <TableCell>
                  <RequestStatusBadge status={r.status} />
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

function StatusFilterLink({
  label,
  status,
  current,
}: {
  label: string;
  status: string | undefined;
  current: string | undefined;
}) {
  const isActive = current === status || (!current && !status);
  const href = status ? `/requests?status=${status}` : "/requests";
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
}
