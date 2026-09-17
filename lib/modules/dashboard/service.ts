import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError, isAdminRole, scopedClubId, type SessionUser } from "@/lib/auth/permissions";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Statistiques publiques (page d'accueil, non authentifiée) — uniquement des
 * compteurs agrégés, jamais de donnée nominative. Voir DECISIONS.md D14 :
 * mêmes chiffres affichés publiquement que sur fesengym.com (athlètes,
 * clubs), calculés depuis la vraie base plutôt que codés en dur.
 */
export async function getPublicStats() {
  const [totalAthletes, activeClubs, activeLicenses, currentSeason] = await Promise.all([
    prisma.athlete.count(),
    prisma.club.count({ where: { status: "ACTIVE" } }),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.season.findFirst({ where: { isCurrent: true }, select: { name: true } }),
  ]);

  return { totalAthletes, activeClubs, activeLicenses, currentSeasonName: currentSeason?.name ?? null };
}

/**
 * KPI calculés via des agrégations SQL (count/sum), jamais en récupérant
 * l'ensemble des lignes pour les compter côté application — voir
 * ARCHITECTURE.md §13.
 */
export async function getAdminDashboardStats(user: SessionUser) {
  if (!isAdminRole(user.role)) throw new ForbiddenError();

  const currentSeason = await prisma.season.findFirst({ where: { isCurrent: true } });
  const now = new Date();
  const in30Days = daysFromNow(30);
  const in7Days = daysFromNow(7);

  const [
    totalAthletes,
    totalClubs,
    activeClubs,
    activeLicenses,
    expiredLicenses,
    expiringSoon,
    expiringUrgent,
    pendingRequests,
    pendingPayments,
    seasonRevenue,
  ] = await Promise.all([
    prisma.athlete.count(),
    prisma.club.count(),
    prisma.club.count({ where: { status: "ACTIVE" } }),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.license.count({ where: { status: "EXPIRED" } }),
    prisma.license.count({
      where: { status: "ACTIVE", expiresAt: { gte: now, lte: in30Days } },
    }),
    prisma.license.count({
      where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } },
    }),
    prisma.licenseRequest.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "CORRECTION_REQUESTED"] } },
    }),
    prisma.payment.count({ where: { status: "PAID" } }),
    currentSeason
      ? prisma.payment.aggregate({
          where: { status: "VERIFIED", licenseRequest: { seasonId: currentSeason.id } },
          _sum: { amount: true },
        })
      : null,
  ]);

  const licensesByDiscipline = await prisma.license.groupBy({
    by: ["disciplineId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  const disciplines = await prisma.discipline.findMany({
    where: { id: { in: licensesByDiscipline.map((l) => l.disciplineId) } },
    select: { id: true, name: true },
  });
  const disciplineNameById = new Map(disciplines.map((d) => [d.id, d.name]));

  return {
    currentSeasonName: currentSeason?.name ?? null,
    totalAthletes,
    totalClubs,
    activeClubs,
    activeLicenses,
    expiredLicenses,
    expiringSoon,
    expiringUrgent,
    pendingRequests,
    pendingPayments,
    seasonRevenue: seasonRevenue?._sum.amount?.toString() ?? "0",
    licensesByDiscipline: licensesByDiscipline
      .map((l) => ({
        disciplineName: disciplineNameById.get(l.disciplineId) ?? "—",
        count: l._count._all,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getClubDashboardStats(user: SessionUser) {
  const clubId = scopedClubId(user);
  if (!clubId) throw new Error("Portée club requise.");

  const now = new Date();
  const in30Days = daysFromNow(30);

  const [
    totalAthletes,
    activeLicenses,
    expiredLicenses,
    pendingRequests,
    expiringLicenses,
  ] = await Promise.all([
    prisma.athlete.count({ where: { clubId } }),
    prisma.license.count({ where: { clubId, status: "ACTIVE" } }),
    prisma.license.count({ where: { clubId, status: "EXPIRED" } }),
    prisma.licenseRequest.count({
      where: { clubId, status: { in: ["SUBMITTED", "UNDER_REVIEW", "CORRECTION_REQUESTED"] } },
    }),
    prisma.license.findMany({
      where: { clubId, status: "ACTIVE", expiresAt: { gte: now, lte: in30Days } },
      orderBy: { expiresAt: "asc" },
      take: 10,
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
        discipline: { select: { name: true } },
      },
    }),
  ]);

  const withDaysRemaining = expiringLicenses.map((l) => ({
    ...l,
    daysRemaining: Math.ceil((l.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  }));

  return {
    totalAthletes,
    activeLicenses,
    expiredLicenses,
    pendingRequests,
    expiringLicenses: withDaysRemaining,
  };
}
