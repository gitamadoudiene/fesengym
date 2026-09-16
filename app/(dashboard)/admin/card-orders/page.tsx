import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listCardOrders } from "@/lib/modules/cardOrders/service";
import { listCardOrdersQuerySchema } from "@/lib/modules/cardOrders/schema";
import { CardOrderStatusSelect } from "@/components/admin/card-order-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Commande reçue",
  PRINTING: "En impression",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export default async function CardOrdersPage({
  searchParams,
}: PageProps<"/admin/card-orders">) {
  const user = await requireSessionUser();
  if (!can(user, "card.manage")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = listCardOrdersQuerySchema.parse({
    status: typeof params.status === "string" ? params.status : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { items, total } = await listCardOrders(user, query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Commandes de cartes
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} commande{total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["REQUESTED", "PRINTING", "SHIPPED", "DELIVERED"].map((s) => (
          <Link
            key={s}
            href={`/admin/card-orders?status=${s}`}
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
              <TableHead>Licence</TableHead>
              <TableHead>Athlète</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Demandée le</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Aucune commande trouvée.
                </TableCell>
              </TableRow>
            )}
            {items.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/licenses/${order.licenseId}`}
                    className="font-mono text-xs text-foreground hover:underline"
                  >
                    {order.license.number}
                  </Link>
                </TableCell>
                <TableCell>
                  {order.license.athlete.firstName} {order.license.athlete.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">{order.club.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.requestedAt.toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <CardOrderStatusSelect orderId={order.id} status={order.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
