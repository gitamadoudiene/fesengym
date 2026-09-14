import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can, scopedClubId } from "@/lib/auth/permissions";
import { getRequestById } from "@/lib/modules/licenseRequests/service";
import { getApplicableFee } from "@/lib/modules/licenseFees/service";
import { NotFoundError } from "@/lib/errors";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { PaymentSection } from "@/components/requests/payment-section";
import { RequestActions } from "@/components/requests/request-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RequestDetailPage({
  params,
}: PageProps<"/requests/[id]">) {
  const user = await requireSessionUser();
  const { id } = await params;

  let request;
  try {
    request = await getRequestById(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const isOwnClub = scopedClubId(user) === null || scopedClubId(user) === request.clubId;
  const activePayment =
    request.payments.find((p) => p.status !== "REJECTED" && p.status !== "FAILED") ?? null;

  let amountHint: { amount: string; currency: string } | null = null;
  if (!activePayment) {
    try {
      const fee = await getApplicableFee({
        seasonId: request.season.id,
        categoryId: request.category.id,
        disciplineId: request.discipline.id,
        type: request.type,
      });
      amountHint = { amount: fee.amount.toString(), currency: fee.currency };
    } catch {
      amountHint = null;
    }
  }

  const canSubmit =
    can(user, "request.create") &&
    isOwnClub &&
    (request.status === "DRAFT" || request.status === "CORRECTION_REQUESTED") &&
    !!activePayment;
  const canStartReview = can(user, "request.review") && request.status === "SUBMITTED";
  const canRequestCorrection =
    can(user, "request.review") &&
    (request.status === "SUBMITTED" || request.status === "UNDER_REVIEW");
  const canDecide = can(user, "request.decide") && request.status === "UNDER_REVIEW";
  const canRecordPayment =
    can(user, "payment.record") &&
    isOwnClub &&
    (request.status === "DRAFT" || request.status === "CORRECTION_REQUESTED") &&
    !activePayment;
  const canVerifyPayment = can(user, "payment.verify");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{request.number}</p>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {request.athlete.firstName} {request.athlete.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <span className="text-sm text-muted-foreground">
              {request.club.name} · Saison {request.season.name}
            </span>
          </div>
        </div>
      </div>

      {(canSubmit || canStartReview || canRequestCorrection || canDecide) && (
        <RequestActions
          requestId={request.id}
          actions={{ canSubmit, canStartReview, canRequestCorrection, canDecide }}
        />
      )}

      {request.correctionReason && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-warning">Correction demandée</p>
            <p className="mt-1 text-muted-foreground">{request.correctionReason}</p>
          </CardContent>
        </Card>
      )}

      {request.rejectionReason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">Demande rejetée</p>
            <p className="mt-1 text-muted-foreground">{request.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {request.resultLicense && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex items-center justify-between pt-6 text-sm">
            <span>
              Licence délivrée :{" "}
              <span className="font-mono font-medium">{request.resultLicense.number}</span>
            </span>
            <Link href={`/licenses/${request.resultLicense.id}`} className="text-primary hover:underline">
              Voir la licence →
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Type" value={request.type} />
          <Field label="Discipline" value={request.discipline.name} />
          <Field label="Catégorie" value={request.category.name} />
          <Field
            label="Licence à renouveler"
            value={request.originLicense?.number}
          />
          <Field label="Notes" value={request.notes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentSection
            requestId={request.id}
            payment={
              activePayment
                ? { ...activePayment, amount: activePayment.amount.toString() }
                : null
            }
            amountHint={amountHint}
            canRecord={canRecordPayment}
            canVerify={canVerifyPayment}
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
