import Link from "next/link";
import { requireSessionUser } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { isAdminRole } from "@/lib/auth/permissions";
import {
  getAdminDashboardStats,
  getClubDashboardStats,
} from "@/lib/modules/dashboard/service";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Bienvenue</h1>
        <p className="text-sm text-muted-foreground">
          Connecté en tant que {ROLE_LABELS[user.role]}.
        </p>
      </div>

      {isAdminRole(user.role) ? <AdminDashboard /> : <ClubDashboard />}
    </div>
  );
}

async function AdminDashboard() {
  const user = await requireSessionUser();
  const stats = await getAdminDashboardStats(user);

  return (
    <div className="space-y-6">
      {stats.currentSeasonName && (
        <p className="text-sm text-muted-foreground">
          Saison courante : <span className="font-medium text-foreground">{stats.currentSeasonName}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Athlètes" value={stats.totalAthletes} accent="primary" />
        <KpiCard label="Clubs actifs" value={`${stats.activeClubs}/${stats.totalClubs}`} accent="secondary" />
        <KpiCard label="Licences actives" value={stats.activeLicenses} accent="success" />
        <KpiCard label="Licences expirées" value={stats.expiredLicenses} accent="danger" />
        <KpiCard label="Expirent sous 30j" value={stats.expiringSoon} accent="warning" />
        <KpiCard label="Expirent sous 7j" value={stats.expiringUrgent} accent="warning" />
        <KpiCard label="Demandes à traiter" value={stats.pendingRequests} accent="info" />
        <KpiCard label="Paiements à vérifier" value={stats.pendingPayments} accent="info" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recettes de la saison</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-extrabold text-foreground">
              {stats.seasonRevenue} <span className="text-lg font-medium text-muted-foreground">XOF</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Paiements vérifiés uniquement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licences par discipline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.licensesByDiscipline.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune licence active.</p>
            )}
            {stats.licensesByDiscipline.map((d) => (
              <div key={d.disciplineName} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{d.disciplineName}</span>
                <span className="font-medium tabular-nums text-foreground">{d.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {(stats.pendingRequests > 0 || stats.pendingPayments > 0) && (
        <Card className="border-info/30 bg-info/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6 text-sm">
            <span>
              {stats.pendingRequests} demande{stats.pendingRequests > 1 ? "s" : ""} à traiter,{" "}
              {stats.pendingPayments} paiement{stats.pendingPayments > 1 ? "s" : ""} à vérifier.
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" render={<Link href="/requests?status=SUBMITTED" />}>
                Voir les demandes
              </Button>
              <Button size="sm" variant="secondary" render={<Link href="/payments?status=PAID" />}>
                Voir les paiements
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function ClubDashboard() {
  const user = await requireSessionUser();
  const stats = await getClubDashboardStats(user);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Athlètes" value={stats.totalAthletes} accent="primary" />
        <KpiCard label="Licences actives" value={stats.activeLicenses} accent="success" />
        <KpiCard label="Licences expirées" value={stats.expiredLicenses} accent="danger" />
        <KpiCard label="Demandes en cours" value={stats.pendingRequests} accent="info" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Licences arrivant bientôt à expiration</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.expiringLicenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune licence n&apos;expire dans les 30 prochains jours.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Athlète</TableHead>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Licence</TableHead>
                    <TableHead>Jours restants</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.expiringLicenses.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        {l.athlete.firstName} {l.athlete.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.discipline.name}</TableCell>
                      <TableCell className="font-mono text-xs">{l.number}</TableCell>
                      <TableCell className="tabular-nums">{l.daysRemaining} j</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          render={
                            <Link
                              href={`/requests/new?athleteId=${l.athlete.id}&originLicenseId=${l.id}&type=RENEWAL`}
                            />
                          }
                        >
                          Renouveler
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
