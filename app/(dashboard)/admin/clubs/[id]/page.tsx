import { notFound, redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { isAdminRole, can } from "@/lib/auth/permissions";
import { getClubById } from "@/lib/modules/clubs/service";
import { listDocumentsForOwner } from "@/lib/modules/documents/service";
import { NotFoundError } from "@/lib/errors";
import { ClubStatusBadge } from "@/components/clubs/club-status-badge";
import { DocumentsList } from "@/components/documents/documents-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubForm } from "../club-form";
import { ClubStatusActions } from "./status-actions";
import { ClubApplicationActions } from "./application-actions";

export default async function ClubDetailPage({
  params,
}: PageProps<"/admin/clubs/[id]">) {
  const user = await requireSessionUser();
  if (!isAdminRole(user.role)) {
    redirect("/club/profile");
  }

  const { id } = await params;

  let club;
  try {
    club = await getClubById(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const documents =
    club.status === "PENDING" || club.status === "REJECTED"
      ? await listDocumentsForOwner(user, "CLUB", club.id)
      : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{club.code}</p>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {club.name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <ClubStatusBadge status={club.status} />
            <span className="text-sm text-muted-foreground">
              {club._count.athletes} athlète{club._count.athletes > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {can(user, "club.manage") && club.status !== "PENDING" && (
          <ClubStatusActions clubId={club.id} status={club.status} />
        )}
      </div>

      {can(user, "club.manage") && club.status === "PENDING" && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-foreground">
              Ce club a soumis une demande d&apos;adhésion. Vérifiez les
              documents ci-dessous avant de valider.
            </p>
            <DocumentsList documents={documents} />
            <ClubApplicationActions clubId={club.id} />
          </CardContent>
        </Card>
      )}

      {club.status === "REJECTED" && club.rejectionReason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-medium text-destructive">Adhésion refusée</p>
            <p className="mt-1 text-muted-foreground">{club.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Sigle" value={club.acronym} />
          <Field label="N° d'affiliation" value={club.affiliationNumber} />
          <Field label="Ville" value={club.city} />
          <Field label="Région" value={club.region} />
          <Field label="Adresse" value={club.address} />
          <Field label="Téléphone" value={club.phone} />
          <Field label="Email" value={club.email} />
          <Field label="Responsable" value={club.managerName} />
          <Field label="Président" value={club.presidentName} />
        </CardContent>
      </Card>

      {can(user, "club.manage") && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier</CardTitle>
          </CardHeader>
          <CardContent>
            <ClubForm
              clubId={club.id}
              defaultValues={{
                name: club.name,
                acronym: club.acronym ?? undefined,
                affiliationNumber: club.affiliationNumber ?? undefined,
                address: club.address ?? undefined,
                city: club.city ?? undefined,
                region: club.region ?? undefined,
                phone: club.phone ?? undefined,
                email: club.email ?? undefined,
                managerName: club.managerName ?? undefined,
                presidentName: club.presidentName ?? undefined,
                notes: club.notes ?? undefined,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-foreground">{value || "—"}</p>
    </div>
  );
}
