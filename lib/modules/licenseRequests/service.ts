import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertCan, scopedClubId, type SessionUser } from "@/lib/auth/permissions";
import { generateRequestNumber } from "@/lib/modules/numbering/service";
import { issueLicenseForRequest } from "@/lib/modules/licenses/service";
import { assertClubActiveForSelfService } from "@/lib/modules/clubs/service";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { notifyClub, notifyFederalAdmins } from "@/lib/modules/notifications/service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type { CreateRequestInput, ListRequestsQuery } from "./schema";
import type { Prisma } from "@prisma/client";

const REQUEST_INCLUDE = {
  athlete: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
  club: { select: { id: true, name: true } },
  season: { select: { id: true, name: true, endDate: true } },
  discipline: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  payments: { orderBy: { createdAt: "desc" as const } },
  originLicense: { select: { number: true } },
  resultLicense: { select: { id: true, number: true } },
} satisfies Prisma.LicenseRequestInclude;

export async function listRequests(user: SessionUser, query: ListRequestsQuery) {
  assertCan(user, "athlete.view"); // consultation de dossier — même portée que les athlètes

  const restrictedClubId = scopedClubId(user);
  const where: Prisma.LicenseRequestWhereInput = {};
  if (restrictedClubId) where.clubId = restrictedClubId;
  else if (query.clubId) where.clubId = query.clubId;
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [items, total] = await Promise.all([
    prisma.licenseRequest.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.licenseRequest.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getRequestById(user: SessionUser, id: string) {
  assertCan(user, "athlete.view");

  const request = await prisma.licenseRequest.findUnique({
    where: { id },
    include: REQUEST_INCLUDE,
  });
  if (!request) throw new NotFoundError("Demande introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && request.clubId !== restrictedClubId) {
    throw new NotFoundError("Demande introuvable.");
  }

  return request;
}

export async function createRequest(user: SessionUser, input: CreateRequestInput) {
  assertCan(user, "request.create");

  const athlete = await prisma.athlete.findUnique({ where: { id: input.athleteId } });
  if (!athlete) throw new NotFoundError("Athlète introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && athlete.clubId !== restrictedClubId) {
    throw new NotFoundError("Athlète introuvable.");
  }
  await assertClubActiveForSelfService(user, athlete.clubId);

  const [season, discipline, category] = await Promise.all([
    prisma.season.findUnique({ where: { id: input.seasonId } }),
    prisma.discipline.findUnique({ where: { id: input.disciplineId } }),
    prisma.category.findUnique({ where: { id: input.categoryId } }),
  ]);
  if (!season) throw new NotFoundError("Saison introuvable.");
  if (!discipline || !discipline.active) throw new ValidationError("Discipline invalide.");
  if (!category || !category.active) throw new ValidationError("Catégorie invalide.");

  if (input.type === "RENEWAL") {
    if (!input.originLicenseId) {
      throw new ValidationError("La licence à renouveler est requise.");
    }
    const originLicense = await prisma.license.findUnique({
      where: { id: input.originLicenseId },
    });
    if (!originLicense || originLicense.athleteId !== athlete.id) {
      throw new ValidationError("La licence à renouveler ne correspond pas à cet athlète.");
    }
  }

  const existingDraft = await prisma.licenseRequest.findFirst({
    where: {
      athleteId: athlete.id,
      seasonId: input.seasonId,
      status: { notIn: ["REJECTED"] },
    },
  });
  if (existingDraft) {
    throw new ConflictError(
      "Une demande existe déjà pour cet athlète sur cette saison.",
    );
  }

  const year = season.endDate.getFullYear();
  const number = await generateRequestNumber(year, season.id);

  const request = await prisma.licenseRequest.create({
    data: {
      number,
      athleteId: athlete.id,
      clubId: athlete.clubId,
      seasonId: season.id,
      disciplineId: discipline.id,
      categoryId: category.id,
      type: input.type,
      status: "DRAFT",
      originLicenseId: input.originLicenseId || null,
      notes: input.notes || null,
    },
    include: REQUEST_INCLUDE,
  });

  await writeAuditLog({
    userId: user.id,
    action: "request.create",
    entity: "LicenseRequest",
    entityId: request.id,
    metadata: { number },
  });

  return request;
}

export async function submitRequest(user: SessionUser, id: string) {
  assertCan(user, "request.create");

  const request = await prisma.licenseRequest.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!request) throw new NotFoundError("Demande introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && request.clubId !== restrictedClubId) {
    throw new NotFoundError("Demande introuvable.");
  }
  if (request.status !== "DRAFT" && request.status !== "CORRECTION_REQUESTED") {
    throw new ConflictError("Cette demande ne peut pas être soumise dans son état actuel.");
  }
  if (request.payments.length === 0) {
    throw new ConflictError("Un paiement doit être enregistré avant de soumettre la demande.");
  }

  const updated = await prisma.licenseRequest.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
    include: REQUEST_INCLUDE,
  });

  await writeAuditLog({
    userId: user.id,
    action: "request.submit",
    entity: "LicenseRequest",
    entityId: id,
  });

  await notifyFederalAdmins({
    type: "NEW_REQUEST_ADMIN",
    title: "Nouvelle demande de licence",
    message: `La demande ${request.number} a été soumise.`,
    link: `/admin/requests/${id}`,
  });

  return updated;
}

export async function startReview(user: SessionUser, id: string) {
  assertCan(user, "request.review");

  const request = await prisma.licenseRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError("Demande introuvable.");
  if (request.status !== "SUBMITTED") {
    throw new ConflictError("Cette demande n'est pas en attente de vérification.");
  }

  const updated = await prisma.licenseRequest.update({
    where: { id },
    data: { status: "UNDER_REVIEW", agentId: user.id },
    include: REQUEST_INCLUDE,
  });

  await writeAuditLog({
    userId: user.id,
    action: "request.start_review",
    entity: "LicenseRequest",
    entityId: id,
  });

  return updated;
}

export async function requestCorrection(user: SessionUser, id: string, reason: string) {
  assertCan(user, "request.review");

  const request = await prisma.licenseRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError("Demande introuvable.");
  if (request.status !== "UNDER_REVIEW" && request.status !== "SUBMITTED") {
    throw new ConflictError("Cette demande ne peut pas être renvoyée pour correction.");
  }

  const updated = await prisma.licenseRequest.update({
    where: { id },
    data: { status: "CORRECTION_REQUESTED", correctionReason: reason },
    include: REQUEST_INCLUDE,
  });

  await writeAuditLog({
    userId: user.id,
    action: "request.request_correction",
    entity: "LicenseRequest",
    entityId: id,
    metadata: { reason },
  });

  await notifyClub({
    clubId: request.clubId,
    type: "REQUEST_CORRECTION_REQUESTED",
    title: "Correction demandée",
    message: `La demande ${request.number} nécessite une correction : ${reason}`,
    link: `/requests/${id}`,
  });

  return updated;
}

export async function approveRequest(user: SessionUser, id: string) {
  assertCan(user, "request.decide");

  const request = await prisma.licenseRequest.findUnique({
    where: { id },
    include: { payments: true, season: { select: { endDate: true } } },
  });
  if (!request) throw new NotFoundError("Demande introuvable.");
  if (request.status !== "UNDER_REVIEW") {
    throw new ConflictError("Cette demande doit être en cours de vérification pour être validée.");
  }

  const verifiedPayment = request.payments.find((p) => p.status === "VERIFIED");
  if (!verifiedPayment) {
    throw new ConflictError(
      "Le paiement de cette demande doit être vérifié avant validation.",
    );
  }

  const license = await issueLicenseForRequest(user.id, request);

  const updated = await prisma.licenseRequest.update({
    where: { id },
    data: { status: "APPROVED", processedAt: new Date(), validatorId: user.id },
    include: REQUEST_INCLUDE,
  });

  await writeAuditLog({
    userId: user.id,
    action: "request.approve",
    entity: "LicenseRequest",
    entityId: id,
    metadata: { licenseId: license.id, licenseNumber: license.number },
  });

  await notifyClub({
    clubId: request.clubId,
    type: "LICENSE_ISSUED",
    title: "Licence délivrée",
    message: `La licence ${license.number} a été délivrée suite à la demande ${request.number}.`,
    link: `/licenses/${license.id}`,
  });

  return { request: updated, license };
}

export async function rejectRequest(user: SessionUser, id: string, reason: string) {
  assertCan(user, "request.decide");

  const request = await prisma.licenseRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError("Demande introuvable.");
  if (request.status === "APPROVED" || request.status === "REJECTED") {
    throw new ConflictError("Cette demande a déjà été traitée.");
  }

  const updated = await prisma.licenseRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      processedAt: new Date(),
      validatorId: user.id,
    },
    include: REQUEST_INCLUDE,
  });

  await writeAuditLog({
    userId: user.id,
    action: "request.reject",
    entity: "LicenseRequest",
    entityId: id,
    metadata: { reason },
  });

  await notifyClub({
    clubId: request.clubId,
    type: "REQUEST_REJECTED",
    title: "Demande rejetée",
    message: `La demande ${request.number} a été rejetée : ${reason}`,
    link: `/requests/${id}`,
  });

  return updated;
}
