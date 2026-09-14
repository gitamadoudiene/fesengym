import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { ClubForm } from "../club-form";

export default async function NewClubPage() {
  const user = await requireSessionUser();
  if (!can(user, "club.manage")) {
    redirect("/admin/clubs");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Nouveau club
        </h1>
        <p className="text-sm text-muted-foreground">
          Le code du club sera généré automatiquement.
        </p>
      </div>
      <ClubForm />
    </div>
  );
}
