import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listPayments } from "@/lib/modules/payments/service";
import { listPaymentsQuerySchema } from "@/lib/modules/payments/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PAID: "À vérifier",
  VERIFIED: "Vérifié",
  FAILED: "Échoué",
  REJECTED: "Rejeté",
  REFUNDED: "Remboursé",
};

export default async function PaymentsPage({
  searchParams,
}: PageProps<"/payments">) {
  const user = await requireSessionUser();
  if (!can(user, "payment.verify")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = listPaymentsQuerySchema.parse({
    status: typeof params.status === "string" ? params.status : "PAID",
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { items, total } = await listPayments(user, query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Paiements
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} paiement{total > 1 ? "s" : ""}
          {query.status ? ` — ${STATUS_LABELS[query.status]}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["PAID", "VERIFIED", "REJECTED"].map((s) => (
          <Link
            key={s}
            href={`/payments?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              query.status === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Athlète</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Demande</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aucun paiement trouvé.
                </TableCell>
              </TableRow>
            )}
            {items.map((p) => (
              <TableRow key={p.id} className="hover:bg-accent/40">
                <TableCell>
                  <Link
                    href={`/requests/${p.licenseRequestId}`}
                    className="font-mono text-xs text-foreground hover:underline"
                  >
                    {p.reference}
                  </Link>
                </TableCell>
                <TableCell>
                  {p.athlete.firstName} {p.athlete.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.club.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.licenseRequest.number}
                </TableCell>
                <TableCell className="tabular-nums">
                  {p.amount.toString()} {p.currency}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[p.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
