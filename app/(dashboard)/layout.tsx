import { requireSessionUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getNavGroupsForRole } from "@/components/layout/nav-config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireSessionUser();

  // Nom affiché : on va le chercher en base (le JWT ne porte que id/role/
  // clubId/athleteId — voir auth.ts — pour éviter les données périmées si le
  // profil change pendant la durée de vie du token).
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { firstName: true, lastName: true, role: true },
  });

  const navGroups = getNavGroupsForRole(sessionUser.role);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar navGroups={navGroups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          name={`${user.firstName} ${user.lastName}`}
          role={user.role}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
