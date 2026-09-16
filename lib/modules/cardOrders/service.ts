import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertCan, scopedClubId, type SessionUser } from "@/lib/auth/permissions";
import { assertClubActiveForSelfService } from "@/lib/modules/clubs/service";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { notifyClub, notifyFederalAdmins } from "@/lib/modules/notifications/service";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { CardOrderStatus, Prisma } from "@prisma/client";

export async function createCardOrder(user: SessionUser, licenseId: string) {
  assertCan(user, "card.order");

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) throw new NotFoundError("Licence introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && license.clubId !== restrictedClubId) {
    throw new NotFoundError("Licence introuvable.");
  }
  await assertClubActiveForSelfService(user, license.clubId);

  if (license.status !== "ACTIVE") {
    throw new ConflictError("Seule une licence active peut faire l'objet d'une commande de carte.");
  }

  const existingOrder = await prisma.cardOrder.findFirst({
    where: { licenseId, status: { in: ["REQUESTED", "PRINTING", "SHIPPED"] } },
  });
  if (existingOrder) {
    throw new ConflictError("Une commande est déjà en cours pour cette licence.");
  }

  const order = await prisma.cardOrder.create({
    data: {
      licenseId,
      clubId: license.clubId,
      requestedById: user.id,
      status: "REQUESTED",
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "card_order.create",
    entity: "CardOrder",
    entityId: order.id,
    metadata: { licenseId },
  });

  await notifyFederalAdmins({
    type: "CARD_ORDER_UPDATED",
    title: "Nouvelle commande de carte",
    message: `Une carte physique a été commandée pour la licence ${license.number}.`,
    link: `/admin/card-orders`,
  });

  return order;
}

export async function listCardOrders(
  user: SessionUser,
  query: { status?: CardOrderStatus; page: number; pageSize: number },
) {
  const restrictedClubId = scopedClubId(user);
  const where: Prisma.CardOrderWhereInput = {};
  if (restrictedClubId) where.clubId = restrictedClubId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.cardOrder.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        license: {
          select: {
            number: true,
            athlete: { select: { firstName: true, lastName: true } },
          },
        },
        club: { select: { name: true } },
      },
    }),
    prisma.cardOrder.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function updateCardOrderStatus(
  user: SessionUser,
  id: string,
  status: CardOrderStatus,
  trackingReference?: string,
) {
  assertCan(user, "card.manage");

  const order = await prisma.cardOrder.findUnique({ where: { id }, include: { license: true } });
  if (!order) throw new NotFoundError("Commande introuvable.");

  const data: Prisma.CardOrderUpdateInput = { status, trackingReference };
  if (status === "PRINTING") data.printedAt = new Date();
  if (status === "SHIPPED") data.shippedAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();

  const updated = await prisma.cardOrder.update({ where: { id }, data });

  await writeAuditLog({
    userId: user.id,
    action: "card_order.status_change",
    entity: "CardOrder",
    entityId: id,
    metadata: { from: order.status, to: status },
  });

  await notifyClub({
    clubId: order.clubId,
    type: "CARD_ORDER_UPDATED",
    title: "Mise à jour de votre commande de carte",
    message: `La carte pour la licence ${order.license.number} est maintenant : ${status}.`,
    link: `/licenses/${order.licenseId}`,
  });

  return updated;
}
