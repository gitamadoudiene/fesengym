import "server-only";
import { prisma } from "@/lib/db/prisma";
import { generateClubCode } from "@/lib/modules/numbering/service";
import { hashPassword } from "@/lib/modules/users/service";
import { getStorageProvider } from "@/lib/modules/storage";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { notifyClub, notifyFederalAdmins } from "@/lib/modules/notifications/service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertCan, type SessionUser } from "@/lib/auth/permissions";
import type { CreateClubApplicationInput } from "./schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/**
 * Inscription publique d'un club (brief : "auto-inscription + demande
 * d'adhésion"). Accessible sans authentification. Le club est créé avec le
 * statut PENDING — il n'a aucun droit d'agir (créer athlète/demande/
 * paiement) tant qu'un administrateur fédéral ne l'a pas validé, voir
 * assertClubActive() dans lib/modules/clubApplications/guard.ts.
 */
export async function submitClubApplication(
  input: CreateClubApplicationInput,
  documents: { type: string; file: File }[],
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });
  if (existingUser) {
    throw new ConflictError("Un compte existe déjà avec cet email.");
  }

  for (const doc of documents) {
    if (doc.file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`Le fichier "${doc.file.name}" dépasse 10 Mo.`);
    }
    if (!ALLOWED_MIME_TYPES.has(doc.file.type)) {
      throw new ValidationError(`Le fichier "${doc.file.name}" a un type non autorisé.`);
    }
  }

  const code = await generateClubCode();
  const passwordHash = await hashPassword(input.password);

  const { club, user } = await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: {
        code,
        name: input.name,
        acronym: input.acronym || null,
        address: input.address || null,
        city: input.city,
        region: input.region,
        phone: input.phone,
        email: input.email.toLowerCase().trim(),
        presidentName: input.presidentName,
        managerName: `${input.managerFirstName} ${input.managerLastName}`,
        status: "PENDING",
      },
    });

    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        firstName: input.managerFirstName,
        lastName: input.managerLastName,
        role: "CLUB_MANAGER",
        clubId: club.id,
        passwordHash,
        status: "ACTIVE",
      },
    });

    return { club, user };
  });

  const storage = getStorageProvider();
  for (const doc of documents) {
    const buffer = Buffer.from(await doc.file.arrayBuffer());
    const extension = doc.file.name.split(".").pop() || "bin";
    const key = `club/${club.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const stored = await storage.save({ key, buffer, mimeType: doc.file.type });

    await prisma.document.create({
      data: {
        type: doc.type as "ADMINISTRATIVE",
        name: doc.file.name,
        storageKey: stored.key,
        mimeType: doc.file.type,
        size: doc.file.size,
        ownerType: "CLUB",
        clubId: club.id,
        uploadedById: user.id,
      },
    });
  }

  await writeAuditLog({
    userId: user.id,
    action: "club.application_submitted",
    entity: "Club",
    entityId: club.id,
    metadata: { code: club.code },
  });

  await notifyFederalAdmins({
    type: "NEW_CLUB_APPLICATION_ADMIN",
    title: "Nouvelle demande d'adhésion",
    message: `${club.name} a soumis une demande d'adhésion.`,
    link: `/admin/clubs/${club.id}`,
  });

  return club;
}

export async function approveClubApplication(user: SessionUser, clubId: string) {
  assertCan(user, "club.manage");

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new NotFoundError("Club introuvable.");
  if (club.status !== "PENDING") {
    throw new ConflictError("Cette demande d'adhésion a déjà été traitée.");
  }

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: { status: "ACTIVE", reviewedAt: new Date(), reviewedById: user.id, rejectionReason: null },
  });

  await writeAuditLog({
    userId: user.id,
    action: "club.application_approve",
    entity: "Club",
    entityId: clubId,
  });

  await notifyClub({
    clubId,
    type: "CLUB_APPLICATION_APPROVED",
    title: "Adhésion validée",
    message: `Votre club ${club.name} est maintenant actif sur la plateforme.`,
    link: "/club/profile",
  });

  return updated;
}

export async function rejectClubApplication(user: SessionUser, clubId: string, reason: string) {
  assertCan(user, "club.manage");

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new NotFoundError("Club introuvable.");
  if (club.status !== "PENDING") {
    throw new ConflictError("Cette demande d'adhésion a déjà été traitée.");
  }

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "club.application_reject",
    entity: "Club",
    entityId: clubId,
    metadata: { reason },
  });

  await notifyClub({
    clubId,
    type: "CLUB_APPLICATION_REJECTED",
    title: "Adhésion refusée",
    message: `Votre demande d'adhésion a été refusée : ${reason}`,
    link: "/club/profile",
  });

  return updated;
}
