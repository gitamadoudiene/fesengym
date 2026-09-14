import "server-only";
import { prisma } from "@/lib/db/prisma";

const ALERT_THRESHOLDS_DAYS = [30, 15, 7] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Voir ARCHITECTURE.md §8. Appelée par /api/cron/expire-licenses (scheduler
 * externe) ou par scripts/worker.ts (self-host). Ne dépend jamais du
 * frontend.
 */
export async function runExpireLicensesJob() {
  const now = new Date();

  const expiredResult = await prisma.license.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  // Notifications d'expiration à J-30 / J-15 / J-7 : on cible les licences
  // dont la date d'expiration tombe exactement sur ce jour, pour n'émettre
  // qu'une seule notification par palier et par licence.
  let notificationsCreated = 0;
  for (const days of ALERT_THRESHOLDS_DAYS) {
    const targetStart = startOfDay(addDays(now, days));
    const targetEnd = addDays(targetStart, 1);

    const soonExpiring = await prisma.license.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: targetStart, lt: targetEnd },
      },
      include: {
        athlete: { select: { firstName: true, lastName: true } },
        club: { select: { id: true } },
      },
    });

    for (const license of soonExpiring) {
      const clubManagers = await prisma.user.findMany({
        where: { clubId: license.clubId, status: "ACTIVE" },
        select: { id: true },
      });

      const message = `La licence ${license.number} de ${license.athlete.firstName} ${license.athlete.lastName} expire dans ${days} jours.`;

      await prisma.notification.createMany({
        data: clubManagers.map((manager) => ({
          userId: manager.id,
          type: "LICENSE_EXPIRING_SOON" as const,
          title: "Licence bientôt expirée",
          message,
          link: `/club/licenses/${license.id}`,
        })),
      });
      notificationsCreated += clubManagers.length;
    }
  }

  return {
    expiredCount: expiredResult.count,
    notificationsCreated,
    ranAt: now.toISOString(),
  };
}
