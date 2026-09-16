import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/modules/storage";
import {
  ForbiddenError,
  assertCan,
  isAdminRole,
  scopedClubId,
  type SessionUser,
} from "@/lib/auth/permissions";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { DocumentOwnerType, DocumentType } from "@prisma/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function assertCanAccessOwner(
  user: SessionUser,
  ownerType: DocumentOwnerType,
  ownerId: string,
): Promise<string> {
  const restrictedClubId = scopedClubId(user);

  if (ownerType === "CLUB") {
    if (restrictedClubId && restrictedClubId !== ownerId) throw new ForbiddenError();
    return ownerId;
  }

  if (ownerType === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({ where: { id: ownerId } });
    if (!athlete) throw new NotFoundError("Athlète introuvable.");
    if (restrictedClubId && athlete.clubId !== restrictedClubId) throw new ForbiddenError();
    return athlete.clubId;
  }

  if (ownerType === "LICENSE_REQUEST") {
    const request = await prisma.licenseRequest.findUnique({ where: { id: ownerId } });
    if (!request) throw new NotFoundError("Demande introuvable.");
    if (restrictedClubId && request.clubId !== restrictedClubId) throw new ForbiddenError();
    return request.clubId;
  }

  // PAYMENT
  const payment = await prisma.payment.findUnique({ where: { id: ownerId } });
  if (!payment) throw new NotFoundError("Paiement introuvable.");
  if (restrictedClubId && payment.clubId !== restrictedClubId) throw new ForbiddenError();
  return payment.clubId;
}

export async function uploadDocument(
  user: SessionUser,
  params: {
    ownerType: DocumentOwnerType;
    ownerId: string;
    type: DocumentType;
    file: File;
  },
) {
  assertCan(user, "athlete.manage"); // même portée que les autres actions club

  if (params.file.size > MAX_FILE_SIZE) {
    throw new ValidationError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }
  if (!ALLOWED_MIME_TYPES.has(params.file.type)) {
    throw new ValidationError("Type de fichier non autorisé (PDF, JPEG, PNG, WebP uniquement).");
  }

  const clubId = await assertCanAccessOwner(user, params.ownerType, params.ownerId);

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const extension = params.file.name.split(".").pop() || "bin";
  const key = `${params.ownerType.toLowerCase()}/${params.ownerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const storage = getStorageProvider();
  const stored = await storage.save({
    key,
    buffer,
    mimeType: params.file.type,
  });

  const document = await prisma.document.create({
    data: {
      type: params.type,
      name: params.file.name,
      storageKey: stored.key,
      mimeType: params.file.type,
      size: params.file.size,
      ownerType: params.ownerType,
      athleteId: params.ownerType === "ATHLETE" ? params.ownerId : null,
      clubId: params.ownerType === "CLUB" ? params.ownerId : clubId,
      licenseRequestId: params.ownerType === "LICENSE_REQUEST" ? params.ownerId : null,
      paymentId: params.ownerType === "PAYMENT" ? params.ownerId : null,
      uploadedById: user.id,
    },
  });

  return document;
}

export async function downloadDocument(user: SessionUser, id: string) {
  const document = await getDocumentForDownload(user, id);
  const storage = getStorageProvider();
  const buffer = await storage.read(document.storageKey);
  return { document, buffer };
}

export async function listDocumentsForOwner(
  user: SessionUser,
  ownerType: DocumentOwnerType,
  ownerId: string,
) {
  await assertCanAccessOwner(user, ownerType, ownerId);

  const where =
    ownerType === "CLUB"
      ? { clubId: ownerId, ownerType }
      : ownerType === "ATHLETE"
        ? { athleteId: ownerId, ownerType }
        : ownerType === "LICENSE_REQUEST"
          ? { licenseRequestId: ownerId, ownerType }
          : { paymentId: ownerId, ownerType };

  return prisma.document.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getDocumentForDownload(user: SessionUser, id: string) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) throw new NotFoundError("Document introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId) {
    const ownerClubId =
      document.clubId ??
      (document.athleteId
        ? (await prisma.athlete.findUnique({ where: { id: document.athleteId } }))?.clubId
        : document.licenseRequestId
          ? (await prisma.licenseRequest.findUnique({ where: { id: document.licenseRequestId } }))
              ?.clubId
          : document.paymentId
            ? (await prisma.payment.findUnique({ where: { id: document.paymentId } }))?.clubId
            : null);
    if (ownerClubId !== restrictedClubId) throw new NotFoundError("Document introuvable.");
  } else if (!isAdminRole(user.role)) {
    throw new ForbiddenError();
  }

  return document;
}
