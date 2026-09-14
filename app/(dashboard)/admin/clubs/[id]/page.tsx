import { notFound, redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { isAdminRole, can } from "@/lib/auth/permissions";
import { getClubById } from "@/lib/modules/clubs/service";
import { NotFoundError } from "@/lib/errors";
import { ClubStatusBadge } from "@/components/clubs/club-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubForm } from "../club-form";
import { ClubStatusActions } from "./status-actions";

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
        {can(user, "club.manage") && (
          <ClubStatusActions clubId={club.id} status={club.status} />
        )}
      </div>

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
