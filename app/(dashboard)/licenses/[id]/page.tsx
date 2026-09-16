import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireSessionUser } from "@/lib/auth/dal";
import { can, scopedClubId } from "@/lib/auth/permissions";
import { getLicenseById } from "@/lib/modules/licenses/service";
import { NotFoundError } from "@/lib/errors";
import { LicenseStatusBadge } from "@/components/licenses/license-status-badge";
import { LicenseActions } from "@/components/licenses/license-actions";
import { CardOrderSection } from "@/components/licenses/card-order-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function LicenseDetailPage({
  params,
}: PageProps<"/licenses/[id]">) {
  const user = await requireSessionUser();
  const { id } = await params;

  let license;
  try {
    license = await getLicenseById(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const isOwnClub = scopedClubId(user) === null || scopedClubId(user) === license.clubId;
  const canRenew =
    can(user, "request.create") &&
    isOwnClub &&
    (license.status === "ACTIVE" || license.status === "EXPIRED");
  const canOrderCard = can(user, "card.order") && isOwnClub && license.status === "ACTIVE";

  const qrSvg = license.qrCodeUrl
    ? await QRCode.toString(license.qrCodeUrl, { type: "svg", margin: 1, width: 96 })
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{license.number}</p>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {license.athlete.firstName} {license.athlete.lastName}
          </h1>
          <div className="mt-1">
            <LicenseStatusBadge status={license.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {canRenew && (
            <Button
              variant="secondary"
              render={
                <Link
                  href={`/requests/new?athleteId=${license.athlete.id}&originLicenseId=${license.id}&type=RENEWAL`}
                />
              }
            >
              Renouveler
            </Button>
          )}
          {can(user, "license.suspend") && (
            <LicenseActions licenseId={license.id} status={license.status} />
          )}
        </div>
      </div>

      {/* Carte de licence — voir DESIGN_SYSTEM.md §4 */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <div className="bg-primary px-5 py-3 text-primary-foreground">
          <p className="font-heading text-sm font-bold tracking-wide">
            LICENCE FSG — {license.season.name}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 bg-card p-5">
          <div className="space-y-1 text-sm">
            <p className="font-heading text-lg font-bold text-foreground">
              {license.athlete.firstName} {license.athlete.lastName}
            </p>
            <p className="text-muted-foreground">{license.club.name}</p>
            <p className="text-muted-foreground">
              {license.discipline.name} · {license.category.name}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{license.number}</p>
            <p className="text-xs text-muted-foreground">
              Émise le {license.issuedAt.toLocaleDateString("fr-FR")} · Expire le{" "}
              {license.expiresAt.toLocaleDateString("fr-FR")}
            </p>
          </div>
          {qrSvg && (
            <div
              className="shrink-0 [&_svg]:h-20 [&_svg]:w-20"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
        </div>
      </div>

      {license.suspensionReason && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-warning">Motif de suspension</p>
            <p className="mt-1 text-muted-foreground">{license.suspensionReason}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm">
          <Field label="Saison" value={license.season.name} />
          <Field
            label="Validée par"
            value={
              license.validatedBy
                ? `${license.validatedBy.firstName} ${license.validatedBy.lastName}`
                : undefined
            }
          />
          <Field label="Date de validation" value={license.validatedAt?.toLocaleDateString("fr-FR")} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <CardOrderSection
            licenseId={license.id}
            latestOrder={license.cardOrders[0] ?? null}
            canOrder={canOrderCard}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
