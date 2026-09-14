import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can, isAdminRole } from "@/lib/auth/permissions";
import { getAthleteById } from "@/lib/modules/athletes/service";
import { listDisciplines } from "@/lib/modules/disciplines/service";
import { listCategories } from "@/lib/modules/categories/service";
import { listClubOptions } from "@/lib/modules/clubs/service";
import { NotFoundError } from "@/lib/errors";
import { calculateAge } from "@/lib/utils/age";
import { AthleteStatusBadge } from "@/components/athletes/athlete-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AthleteForm } from "../athlete-form";

export default async function AthleteDetailPage({
  params,
}: PageProps<"/athletes/[id]">) {
  const user = await requireSessionUser();
  const { id } = await params;

  let athlete;
  try {
    athlete = await getAthleteById(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canEdit = can(user, "athlete.manage");
  const [disciplines, categories, clubs] = await Promise.all([
    listDisciplines(user, { onlyActive: true }),
    listCategories(user, { onlyActive: true }),
    isAdminRole(user.role) ? listClubOptions(user) : Promise.resolve([]),
  ]);

  const age = calculateAge(athlete.dateOfBirth);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-xs text-muted-foreground">
          {athlete.federalNumber ?? "N° fédéral non attribué"}
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {athlete.firstName} {athlete.lastName}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <AthleteStatusBadge status={athlete.status} />
          <span className="text-sm text-muted-foreground">
            {athlete.club.name} · {age} ans
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Date de naissance" value={athlete.dateOfBirth.toLocaleDateString("fr-FR")} />
          <Field label="Sexe" value={athlete.sex === "F" ? "Féminin" : "Masculin"} />
          <Field label="Nationalité" value={athlete.nationality} />
          <Field label="Téléphone" value={athlete.phone} />
          <Field label="Email" value={athlete.email} />
          <Field label="Ville" value={athlete.city} />
          <Field label="Discipline" value={athlete.discipline?.name} />
          <Field label="Catégorie" value={athlete.category?.name} />
          <Field label="Contact d'urgence" value={athlete.emergencyContactName} />
          <Field label="Téléphone d'urgence" value={athlete.emergencyContactPhone} />
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier</CardTitle>
          </CardHeader>
          <CardContent>
            <AthleteForm
              athleteId={athlete.id}
              disciplines={disciplines}
              categories={categories}
              clubs={clubs}
              requireClubSelect={false}
              defaultValues={{
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                dateOfBirth: athlete.dateOfBirth.toISOString().slice(0, 10),
                sex: athlete.sex,
                nationality: athlete.nationality,
                phone: athlete.phone ?? undefined,
                email: athlete.email ?? undefined,
                address: athlete.address ?? undefined,
                city: athlete.city ?? undefined,
                disciplineId: athlete.disciplineId ?? undefined,
                categoryId: athlete.categoryId ?? undefined,
                emergencyContactName: athlete.emergencyContactName ?? undefined,
                emergencyContactPhone: athlete.emergencyContactPhone ?? undefined,
                medicalNotes: athlete.medicalNotes ?? undefined,
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
