import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertCan, type SessionUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { CreateSeasonInput } from "./schema";
import type { SeasonStatus } from "@prisma/client";

export async function listSeasons(user: SessionUser) {
  assertCan(user, "settings.view");
  return prisma.season.findMany({ orderBy: { startDate: "desc" } });
}

export async function getCurrentSeason() {
  return prisma.season.findFirst({ where: { isCurrent: true } });
}

export async function createSeason(user: SessionUser, input: CreateSeasonInput) {
  assertCan(user, "settings.manage");

  const existing = await prisma.season.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError("Une saison avec ce nom existe déjà.");

  const season = await prisma.season.create({
    data: {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "UPCOMING",
      isCurrent: false,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "season.create",
    entity: "Season",
    entityId: season.id,
  });

  return season;
}

/**
 * Une seule saison courante à la fois (règle métier §10/§61 du brief).
 * Enforcée ici de façon transactionnelle — voir aussi le commentaire dans
 * schema.prisma sur l'index unique partiel à ajouter en migration SQL comme
 * filet de sécurité supplémentaire au niveau base de données.
 */
export async function setCurrentSeason(user: SessionUser, id: string) {
  assertCan(user, "settings.manage");

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) throw new NotFoundError("Saison introuvable.");

  await prisma.$transaction([
    prisma.season.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    }),
    prisma.season.update({
      where: { id },
      data: { isCurrent: true, status: "ACTIVE" },
    }),
  ]);

  await writeAuditLog({
    userId: user.id,
    action: "season.set_current",
    entity: "Season",
    entityId: id,
  });

  return prisma.season.findUniqueOrThrow({ where: { id } });
}

export async function setSeasonStatus(user: SessionUser, id: string, status: SeasonStatus) {
  assertCan(user, "settings.manage");

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) throw new NotFoundError("Saison introuvable.");
  if (season.isCurrent && status !== "ACTIVE") {
    throw new ConflictError(
      "Impossible de changer le statut de la saison courante sans en désigner une autre.",
    );
  }

  const updated = await prisma.season.update({ where: { id }, data: { status } });
  await writeAuditLog({
    userId: user.id,
    action: "season.status_change",
    entity: "Season",
    entityId: id,
    metadata: { from: season.status, to: status },
  });
  return updated;
}
