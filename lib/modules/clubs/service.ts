import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertCan, scopedClubId, type SessionUser } from "@/lib/auth/permissions";
import { generateClubCode } from "@/lib/modules/numbering/service";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type {
  CreateClubInput,
  ListClubsQuery,
  UpdateClubInput,
} from "./schema";
import type { ClubStatus, Prisma } from "@prisma/client";

/**
 * Isolation des clubs (ARCHITECTURE.md §6) : un CLUB_MANAGER ne peut jamais
 * lister les autres clubs ni accéder à un club qui n'est pas le sien. On
 * renvoie NotFoundError (404) plutôt que ForbiddenError (403) pour un accès
 * direct par id, afin de ne pas confirmer l'existence de la ressource.
 */
export async function listClubs(user: SessionUser, query: ListClubsQuery) {
  assertCan(user, "club.view");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId) {
    const club = await prisma.club.findUnique({
      where: { id: restrictedClubId },
      include: { _count: { select: { athletes: true } } },
    });
    return {
      items: club ? [club] : [],
      total: club ? 1 : 0,
      page: 1,
      pageSize: 1,
    };
  }

  const where: Prisma.ClubWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.region) where.region = { equals: query.region, mode: "insensitive" };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
      { city: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.club.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { athletes: true } } },
    }),
    prisma.club.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

/**
 * Options légères pour les filtres/sélecteurs (pas de pagination — usage UI
 * uniquement). Réservé aux rôles d'administration : un CLUB_MANAGER n'a pas
 * besoin de la liste des autres clubs.
 */
export async function listClubOptions(user: SessionUser) {
  assertCan(user, "club.view");
  if (scopedClubId(user)) return [];

  return prisma.club.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 300,
  });
}

export async function getClubById(user: SessionUser, id: string) {
  assertCan(user, "club.view");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && restrictedClubId !== id) {
    throw new NotFoundError("Club introuvable.");
  }

  const club = await prisma.club.findUnique({
    where: { id },
    include: { _count: { select: { athletes: true, users: true } } },
  });
  if (!club) throw new NotFoundError("Club introuvable.");
  return club;
}

/**
 * Un club dont l'adhésion n'est pas encore validée (PENDING/REJECTED) ne
 * peut effectuer aucune action en libre-service (créer un athlète, une
 * demande, un paiement) — voir DECISIONS.md sur l'auto-inscription.
 * N'affecte que les CLUB_MANAGER ; un admin agissant pour ce club reste
 * volontaire et n'est pas bloqué ici.
 */
export async function assertClubActiveForSelfService(user: SessionUser, clubId: string) {
  if (user.role !== "CLUB_MANAGER") return;
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { status: true } });
  if (!club) throw new NotFoundError("Club introuvable.");
  if (club.status !== "ACTIVE") {
    throw new ConflictError(
      "Votre club n'est pas encore actif. Votre demande d'adhésion doit être validée par la fédération avant de pouvoir effectuer cette action.",
    );
  }
}

export async function createClub(user: SessionUser, input: CreateClubInput) {
  assertCan(user, "club.manage");

  const code = await generateClubCode();
  const club = await prisma.club.create({
    data: {
      code,
      name: input.name,
      acronym: input.acronym || null,
      affiliationNumber: input.affiliationNumber || null,
      address: input.address || null,
      city: input.city || null,
      region: input.region || null,
      phone: input.phone || null,
      email: input.email || null,
      managerName: input.managerName || null,
      presidentName: input.presidentName || null,
      notes: input.notes || null,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "club.create",
    entity: "Club",
    entityId: club.id,
    metadata: { code: club.code, name: club.name },
  });

  return club;
}

export async function updateClub(
  user: SessionUser,
  id: string,
  input: UpdateClubInput,
) {
  assertCan(user, "club.manage");

  const existing = await prisma.club.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Club introuvable.");

  const club = await prisma.club.update({
    where: { id },
    data: {
      ...input,
      email: input.email === "" ? null : input.email,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "club.update",
    entity: "Club",
    entityId: club.id,
  });

  return club;
}

export async function setClubStatus(
  user: SessionUser,
  id: string,
  status: ClubStatus,
  reason?: string,
) {
  assertCan(user, "club.manage");

  const existing = await prisma.club.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Club introuvable.");

  const club = await prisma.club.update({ where: { id }, data: { status } });

  await writeAuditLog({
    userId: user.id,
    action: status === "SUSPENDED" ? "club.suspend" : "club.status_change",
    entity: "Club",
    entityId: club.id,
    metadata: { from: existing.status, to: status, reason },
  });

  return club;
}
