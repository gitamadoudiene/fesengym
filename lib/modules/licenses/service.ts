import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  assertCan,
  scopedClubId,
  type SessionUser,
} from "@/lib/auth/permissions";
import { generateLicenseNumber } from "@/lib/modules/numbering/service";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { getStorageProvider } from "@/lib/modules/storage";
import { NotFoundError } from "@/lib/errors";
import type { LicenseRequest, Prisma } from "@prisma/client";

function verifyUrlFor(number: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/verify-license/${encodeURIComponent(number)}`;
}

/**
 * Appelée uniquement depuis licenseRequests/service.ts#approveRequest, après
 * vérification qu'un paiement VERIFIED existe (brief règle 15 : une licence
 * ne peut être délivrée sans validation). Ne supprime/écrase jamais une
 * licence existante — un renouvellement crée toujours une nouvelle ligne
 * (brief §17/§61 règle 7).
 */
export async function issueLicenseForRequest(
  validatorId: string,
  request: LicenseRequest & { season: { endDate: Date }; },
) {
  const year = request.season.endDate.getFullYear();
  const number = await generateLicenseNumber(year, request.seasonId);

  const license = await prisma.license.create({
    data: {
      number,
      athleteId: request.athleteId,
      clubId: request.clubId,
      seasonId: request.seasonId,
      disciplineId: request.disciplineId,
      categoryId: request.categoryId,
      originRequestId: request.id,
      issuedAt: new Date(),
      expiresAt: request.season.endDate,
      status: "ACTIVE",
      validatedAt: new Date(),
      validatedById: validatorId,
    },
  });

  const qrCodeUrl = verifyUrlFor(license.number);
  const updated = await prisma.license.update({
    where: { id: license.id },
    data: { qrCodeUrl },
  });

  // Le numéro fédéral est attribué à la première licence délivrée (brief §32).
  await prisma.athlete.updateMany({
    where: { id: request.athleteId, federalNumber: null },
    data: { federalNumber: number },
  });

  await writeAuditLog({
    userId: validatorId,
    action: "license.issue",
    entity: "License",
    entityId: updated.id,
    metadata: { requestId: request.id, number: updated.number },
  });

  return updated;
}

export async function listLicenses(
  user: SessionUser,
  query: {
    clubId?: string;
    seasonId?: string;
    disciplineId?: string;
    categoryId?: string;
    status?: string;
    page: number;
    pageSize: number;
  },
) {
  assertCan(user, "license.view");

  const restrictedClubId = scopedClubId(user);
  const where: Prisma.LicenseWhereInput = {};
  if (restrictedClubId) where.clubId = restrictedClubId;
  else if (query.clubId) where.clubId = query.clubId;
  if (query.seasonId) where.seasonId = query.seasonId;
  if (query.disciplineId) where.disciplineId = query.disciplineId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.status) where.status = query.status as Prisma.EnumLicenseStatusFilter["equals"];

  const [items, total] = await Promise.all([
    prisma.license.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        athlete: { select: { firstName: true, lastName: true } },
        club: { select: { name: true } },
        discipline: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.license.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getLicenseById(user: SessionUser, id: string) {
  assertCan(user, "license.view");

  const license = await prisma.license.findUnique({
    where: { id },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, photoDocumentId: true },
      },
      club: { select: { id: true, name: true } },
      discipline: { select: { name: true } },
      category: { select: { name: true } },
      season: { select: { name: true } },
      payments: { orderBy: { createdAt: "desc" } },
      validatedBy: { select: { firstName: true, lastName: true } },
      cardOrders: { orderBy: { requestedAt: "desc" }, take: 1 },
    },
  });
  if (!license) throw new NotFoundError("Licence introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && license.clubId !== restrictedClubId) {
    throw new NotFoundError("Licence introuvable.");
  }

  return license;
}

/**
 * Vue publique de vérification (brief §20/§33) — aucune authentification,
 * aucune donnée privée. Ne jamais élargir cette sélection sans revérifier
 * qu'aucun champ sensible (email, tel, adresse, infos médicales, documents)
 * ne fuite.
 */
export async function getPublicLicenseView(number: string) {
  const license = await prisma.license.findUnique({
    where: { number },
    select: {
      number: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      athlete: { select: { firstName: true, lastName: true, photoDocumentId: true } },
      club: { select: { name: true } },
      discipline: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  if (!license) return null;

  const now = new Date();
  const effectiveStatus =
    license.status === "ACTIVE" && license.expiresAt < now ? "EXPIRED" : license.status;

  return {
    ...license,
    status: effectiveStatus,
    athlete: {
      firstName: license.athlete.firstName,
      lastName: license.athlete.lastName,
      hasPhoto: !!license.athlete.photoDocumentId,
    },
  };
}

/**
 * Photo publique associée à une licence (brief §19/§33 — la photo fait
 * partie des informations non sensibles affichables sur la vérification
 * publique). Volontairement étroit : uniquement le document de type PHOTO
 * de l'athlète titulaire de CETTE licence, jamais un accès générique aux
 * documents (voir /api/documents/[id] pour l'accès authentifié complet).
 */
export async function getPublicLicensePhoto(number: string) {
  const license = await prisma.license.findUnique({
    where: { number },
    select: { athlete: { select: { photoDocumentId: true } } },
  });
  if (!license?.athlete.photoDocumentId) return null;

  const document = await prisma.document.findUnique({
    where: { id: license.athlete.photoDocumentId },
  });
  if (!document || document.type !== "PHOTO") return null;

  const storage = getStorageProvider();
  const buffer = await storage.read(document.storageKey);
  return { buffer, mimeType: document.mimeType };
}

export async function suspendLicense(user: SessionUser, id: string, reason: string) {
  assertCan(user, "license.suspend");

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) throw new NotFoundError("Licence introuvable.");

  const updated = await prisma.license.update({
    where: { id },
    data: { status: "SUSPENDED", suspensionReason: reason },
  });

  await writeAuditLog({
    userId: user.id,
    action: "license.suspend",
    entity: "License",
    entityId: id,
    metadata: { reason },
  });

  return updated;
}

export async function reactivateLicense(user: SessionUser, id: string) {
  assertCan(user, "license.suspend");

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) throw new NotFoundError("Licence introuvable.");
  if (license.expiresAt < new Date()) {
    return prisma.license.update({ where: { id }, data: { status: "EXPIRED" } });
  }

  const updated = await prisma.license.update({
    where: { id },
    data: { status: "ACTIVE", suspensionReason: null },
  });

  await writeAuditLog({
    userId: user.id,
    action: "license.reactivate",
    entity: "License",
    entityId: id,
  });

  return updated;
}
