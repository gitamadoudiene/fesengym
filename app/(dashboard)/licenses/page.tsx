import Link from "next/link";
import { requireSessionUser } from "@/lib/auth/dal";
import { isAdminRole } from "@/lib/auth/permissions";
import { listLicenses } from "@/lib/modules/licenses/service";
import { listLicensesQuerySchema } from "@/lib/modules/licenses/schema";
import { LicenseStatusBadge } from "@/components/licenses/license-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LicensesListPage({
  searchParams,
}: PageProps<"/licenses">) {
  const user = await requireSessionUser();
  const params = await searchParams;

  const query = listLicensesQuerySchema.parse({
    status: typeof params.status === "string" ? params.status : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { items, total, page, pageSize } = await listLicenses(user, query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Licences
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} licence{total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Toutes", value: undefined },
          { label: "Actives", value: "ACTIVE" },
          { label: "Expirées", value: "EXPIRED" },
          { label: "Suspendues", value: "SUSPENDED" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/licenses?status=${f.value}` : "/licenses"}
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

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Athlète</TableHead>
              {isAdminRole(user.role) && <TableHead>Club</TableHead>}
              <TableHead>Discipline</TableHead>
              <TableHead>Expire le</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <p className="font-medium text-foreground">Aucune licence trouvée</p>
                  <p className="text-sm text-muted-foreground">
                    Aucune licence ne correspond à vos critères.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {items.map((l) => (
              <TableRow key={l.id} className="hover:bg-accent/40">
                <TableCell>
                  <Link href={`/licenses/${l.id}`} className="font-mono text-xs text-foreground hover:underline">
                    {l.number}
                  </Link>
                </TableCell>
                <TableCell>
                  {l.athlete.firstName} {l.athlete.lastName}
                </TableCell>
                {isAdminRole(user.role) && (
                  <TableCell className="text-muted-foreground">{l.club.name}</TableCell>
                )}
                <TableCell className="text-muted-foreground">{l.discipline.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {l.expiresAt.toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <LicenseStatusBadge status={l.status} />
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
