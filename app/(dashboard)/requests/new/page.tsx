import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listAthletes } from "@/lib/modules/athletes/service";
import { listDisciplines } from "@/lib/modules/disciplines/service";
import { listCategories } from "@/lib/modules/categories/service";
import { getCurrentSeason } from "@/lib/modules/seasons/service";
import { RequestForm } from "../request-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewRequestPage({
  searchParams,
}: PageProps<"/requests/new">) {
  const user = await requireSessionUser();
  if (!can(user, "request.create")) {
    redirect("/requests");
  }

  const params = await searchParams;
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div className="max-w-lg">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aucune saison courante n&apos;est configurée. Contactez
            l&apos;administration fédérale avant de créer une demande.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [athletesResult, disciplines, categories] = await Promise.all([
    listAthletes(user, { page: 1, pageSize: 200 }),
    listDisciplines(user, { onlyActive: true }),
    listCategories(user, { onlyActive: true }),
  ]);

  const preselectedAthleteId =
    typeof params.athleteId === "string" ? params.athleteId : undefined;
  const preselectedOriginLicenseId =
    typeof params.originLicenseId === "string" ? params.originLicenseId : undefined;
  const isRenewal = params.type === "RENEWAL";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {isRenewal ? "Renouveler une licence" : "Nouvelle demande de licence"}
        </h1>
        <p className="text-sm text-muted-foreground">Saison {season.name}</p>
      </div>
      <RequestForm
        athletes={athletesResult.items}
        disciplines={disciplines}
        categories={categories}
        seasonId={season.id}
        preselectedAthleteId={preselectedAthleteId}
        preselectedOriginLicenseId={preselectedOriginLicenseId}
        type={isRenewal ? "RENEWAL" : "NEW"}
      />
    </div>
  );
}
