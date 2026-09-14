import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "@prisma/client";

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  await prisma.notification.create({ data: params });
}

/**
 * Notifie tous les responsables actifs d'un club (généralement un seul,
 * mais l'architecture permet plusieurs comptes CLUB_MANAGER par club).
 */
export async function notifyClub(params: {
  clubId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const managers = await prisma.user.findMany({
    where: { clubId: params.clubId, role: "CLUB_MANAGER", status: "ACTIVE" },
    select: { id: true },
  });
  if (managers.length === 0) return;

  await prisma.notification.createMany({
    data: managers.map((m) => ({
      userId: m.id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    })),
  });
}

/**
 * Notifie les administrateurs fédéraux (Super Admin + Admin Fédéral) —
 * utilisé pour les alertes "nouvelle demande" / "paiement à vérifier".
 */
export async function notifyFederalAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "FEDERAL_ADMIN"] },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    })),
  });
}

export async function listNotificationsForUser(userId: string, { onlyUnread = false } = {}) {
  return prisma.notification.findMany({
    where: { userId, read: onlyUnread ? false : undefined },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
