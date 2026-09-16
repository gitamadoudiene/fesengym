import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { getClubById } from "@/lib/modules/clubs/service";
import { listDocumentsForOwner } from "@/lib/modules/documents/service";
import { ClubStatusBadge } from "@/components/clubs/club-status-badge";
import { DocumentsList } from "@/components/documents/documents-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClubProfilePage() {
  const user = await requireSessionUser();
  if (user.role !== "CLUB_MANAGER" || !user.clubId) {
    redirect("/dashboard");
  }

  const club = await getClubById(user, user.clubId);
  const documents =
    club.status === "PENDING" || club.status === "REJECTED"
      ? await listDocumentsForOwner(user, "CLUB", club.id)
      : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground">{club.code}</p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {club.name}
        </h1>
        <div className="mt-1">
          <ClubStatusBadge status={club.status} />
        </div>
      </div>

      {club.status === "PENDING" && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="space-y-3 pt-6 text-sm">
            <p className="font-medium text-warning">
              Votre demande d&apos;adhésion est en cours d&apos;examen
            </p>
            <p className="text-muted-foreground">
              L&apos;administration fédérale vérifie vos documents. Vous
              pourrez gérer vos athlètes et licences dès validation.
            </p>
            <DocumentsList documents={documents} />
          </CardContent>
        </Card>
      )}

      {club.status === "REJECTED" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-3 pt-6 text-sm">
            <p className="font-medium text-destructive">
              Votre demande d&apos;adhésion a été refusée
            </p>
            {club.rejectionReason && (
              <p className="text-muted-foreground">{club.rejectionReason}</p>
            )}
            <p className="text-muted-foreground">
              Contactez l&apos;administration fédérale pour plus
              d&apos;informations.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations du club</CardTitle>
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

      <p className="text-xs text-muted-foreground">
        Pour toute correction sur ces informations, contactez
        l&apos;administration fédérale.
      </p>
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
