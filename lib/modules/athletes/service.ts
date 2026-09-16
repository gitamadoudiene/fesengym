import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  ForbiddenError,
  assertCan,
  isAdminRole,
  scopedClubId,
  type SessionUser,
} from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { assertClubActiveForSelfService } from "@/lib/modules/clubs/service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CreateAthleteInput,
  ListAthletesQuery,
  UpdateAthleteInput,
} from "./schema";
import type { Prisma } from "@prisma/client";

export async function listAthletes(user: SessionUser, query: ListAthletesQuery) {
  assertCan(user, "athlete.view");

  // Un ATHLETE n'a pas de portée club : il ne doit voir que sa propre fiche,
  // jamais la liste (utiliser getAthleteById avec son propre athleteId).
  if (user.role === "ATHLETE") {
    const where: Prisma.AthleteWhereInput = { id: user.athleteId ?? "__none__" };
    const items = await prisma.athlete.findMany({
      where,
      include: {
        club: { select: { id: true, name: true } },
        discipline: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
    return { items, total: items.length, page: 1, pageSize: items.length || 1 };
  }

  const restrictedClubId = scopedClubId(user);
  const where: Prisma.AthleteWhereInput = {};

  if (restrictedClubId) {
    where.clubId = restrictedClubId;
  } else if (query.clubId) {
    where.clubId = query.clubId;
  }

  if (query.disciplineId) where.disciplineId = query.disciplineId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.sex) where.sex = query.sex;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { federalNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.athlete.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        club: { select: { id: true, name: true } },
        discipline: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.athlete.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getAthleteById(user: SessionUser, id: string) {
  assertCan(user, "athlete.view");

  if (user.role === "ATHLETE" && user.athleteId !== id) {
    throw new NotFoundError("Athlète introuvable.");
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true, code: true } },
      discipline: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
  if (!athlete) throw new NotFoundError("Athlète introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && athlete.clubId !== restrictedClubId) {
    throw new NotFoundError("Athlète introuvable.");
  }

  return athlete;
}

/**
 * Détection de doublons (brief §50) — recherche des athlètes au nom/prénom
 * proche et même date de naissance. Volontairement limitée au club de
 * l'appelant pour un CLUB_MANAGER : l'isolation des clubs (ARCHITECTURE.md
 * §6/§30) l'emporte sur l'exhaustivité de la détection — un club ne doit pas
 * apprendre qu'un athlète existe dans un autre club via cette fonctionnalité.
 */
export async function findPotentialDuplicates(
  user: SessionUser,
  params: { firstName: string; lastName: string; dateOfBirth?: string },
) {
  assertCan(user, "athlete.view");
  const restrictedClubId = scopedClubId(user);

  const where: Prisma.AthleteWhereInput = {
    firstName: { equals: params.firstName, mode: "insensitive" },
    lastName: { equals: params.lastName, mode: "insensitive" },
  };
  if (restrictedClubId) where.clubId = restrictedClubId;
  if (params.dateOfBirth && !Number.isNaN(Date.parse(params.dateOfBirth))) {
    where.dateOfBirth = new Date(params.dateOfBirth);
  }

  return prisma.athlete.findMany({
    where,
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      club: { select: { name: true } },
    },
  });
}

export async function createAthlete(user: SessionUser, input: CreateAthleteInput) {
  assertCan(user, "athlete.manage");

  const restrictedClubId = scopedClubId(user);
  const clubId = restrictedClubId ?? input.clubId;
  if (!clubId) {
    throw new ValidationError("Le club est requis.");
  }
  if (!isAdminRole(user.role) && restrictedClubId && input.clubId && input.clubId !== restrictedClubId) {
    throw new ForbiddenError("Impossible de créer un athlète pour un autre club.");
  }

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new NotFoundError("Club introuvable.");
  await assertClubActiveForSelfService(user, clubId);

  const athlete = await prisma.athlete.create({
    data: {
      clubId,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: new Date(input.dateOfBirth),
      sex: input.sex,
      nationality: input.nationality,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
      disciplineId: input.disciplineId || null,
      categoryId: input.categoryId || null,
      emergencyContactName: input.emergencyContactName || null,
      emergencyContactPhone: input.emergencyContactPhone || null,
      medicalNotes: input.medicalNotes || null,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "athlete.create",
    entity: "Athlete",
    entityId: athlete.id,
    metadata: { clubId },
  });

  return athlete;
}

export async function updateAthlete(
  user: SessionUser,
  id: string,
  input: UpdateAthleteInput,
) {
  assertCan(user, "athlete.manage");

  const existing = await prisma.athlete.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Athlète introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && existing.clubId !== restrictedClubId) {
    throw new NotFoundError("Athlète introuvable.");
  }

  const athlete = await prisma.athlete.update({
    where: { id },
    data: {
      ...input,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      email: input.email === "" ? null : input.email,
      disciplineId: input.disciplineId === "" ? null : input.disciplineId,
      categoryId: input.categoryId === "" ? null : input.categoryId,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "athlete.update",
    entity: "Athlete",
    entityId: athlete.id,
  });

  return athlete;
}
