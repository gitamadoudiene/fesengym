import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can, isAdminRole } from "@/lib/auth/permissions";
import { listDisciplines } from "@/lib/modules/disciplines/service";
import { listCategories } from "@/lib/modules/categories/service";
import { listSeasons } from "@/lib/modules/seasons/service";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DisciplinesPanel } from "@/components/settings/disciplines-panel";
import { CategoriesPanel } from "@/components/settings/categories-panel";
import { SeasonsPanel } from "@/components/settings/seasons-panel";

export default async function SettingsPage() {
  const user = await requireSessionUser();
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }

  const [disciplines, categories, seasons] = await Promise.all([
    listDisciplines(user),
    listCategories(user),
    listSeasons(user),
  ]);

  const canManage = can(user, "settings.manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Paramètres
        </h1>
        <p className="text-sm text-muted-foreground">
          Référentiels sportifs de la fédération.
          {!canManage && " Consultation seule — réservé au Super Administrateur pour la modification."}
        </p>
      </div>

      <Tabs defaultValue="seasons">
        <TabsList>
          <TabsTrigger value="seasons">Saisons</TabsTrigger>
          <TabsTrigger value="disciplines">Disciplines</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>
        <TabsContent value="seasons" className="pt-4">
          <SeasonsPanel seasons={seasons} canManage={canManage} />
        </TabsContent>
        <TabsContent value="disciplines" className="pt-4">
          <DisciplinesPanel disciplines={disciplines} canManage={canManage} />
        </TabsContent>
        <TabsContent value="categories" className="pt-4">
          <CategoriesPanel
            categories={categories}
            disciplines={disciplines}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
