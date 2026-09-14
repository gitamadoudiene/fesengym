import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { getClubById } from "@/lib/modules/clubs/service";
import { ClubStatusBadge } from "@/components/clubs/club-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClubProfilePage() {
  const user = await requireSessionUser();
  if (user.role !== "CLUB_MANAGER" || !user.clubId) {
    redirect("/dashboard");
  }

  const club = await getClubById(user, user.clubId);

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
