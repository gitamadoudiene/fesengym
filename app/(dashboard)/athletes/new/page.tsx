import { requireSessionUser } from "@/lib/auth/dal";
import { can, isAdminRole } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { listDisciplines } from "@/lib/modules/disciplines/service";
import { listCategories } from "@/lib/modules/categories/service";
import { listClubOptions } from "@/lib/modules/clubs/service";
import { AthleteForm } from "../athlete-form";

export default async function NewAthletePage() {
  const user = await requireSessionUser();
  if (!can(user, "athlete.manage")) {
    redirect("/athletes");
  }

  const [disciplines, categories, clubs] = await Promise.all([
    listDisciplines(user, { onlyActive: true }),
    listCategories(user, { onlyActive: true }),
    isAdminRole(user.role) ? listClubOptions(user) : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Nouvel athlète
        </h1>
        <p className="text-sm text-muted-foreground">
          Le numéro fédéral sera attribué automatiquement lors de la première
          licence délivrée.
        </p>
      </div>
      <AthleteForm
        disciplines={disciplines}
        categories={categories}
        clubs={clubs}
        requireClubSelect={isAdminRole(user.role)}
      />
    </div>
  );
}
