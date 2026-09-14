import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  assertCan,
  scopedClubId,
  type SessionUser,
} from "@/lib/auth/permissions";
import { generatePaymentReference } from "@/lib/modules/numbering/service";
import { getApplicableFee } from "@/lib/modules/licenseFees/service";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { notifyFederalAdmins } from "@/lib/modules/notifications/service";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { RecordPaymentInput } from "./schema";
import type { Prisma } from "@prisma/client";

export async function recordPayment(user: SessionUser, input: RecordPaymentInput) {
  assertCan(user, "payment.record");

  const request = await prisma.licenseRequest.findUnique({
    where: { id: input.licenseRequestId },
  });
  if (!request) throw new NotFoundError("Demande introuvable.");

  const restrictedClubId = scopedClubId(user);
  if (restrictedClubId && request.clubId !== restrictedClubId) {
    throw new NotFoundError("Demande introuvable.");
  }
  if (request.status !== "DRAFT" && request.status !== "CORRECTION_REQUESTED") {
    throw new ConflictError(
      "Un paiement ne peut être enregistré que pour une demande en préparation.",
    );
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      licenseRequestId: request.id,
      status: { in: ["PENDING", "PAID", "VERIFIED"] },
    },
  });
  if (existingPayment) {
    throw new ConflictError("Un paiement est déjà enregistré pour cette demande.");
  }

  const fee = await getApplicableFee({
    seasonId: request.seasonId,
    categoryId: request.categoryId,
    disciplineId: request.disciplineId,
    type: request.type,
  });

  const year = new Date().getFullYear();
  const reference = await generatePaymentReference(year);

  const payment = await prisma.payment.create({
    data: {
      reference,
      licenseRequestId: request.id,
      athleteId: request.athleteId,
      clubId: request.clubId,
      amount: fee.amount,
      currency: fee.currency,
      method: input.method,
      status: "PAID",
      transactionReference: input.transactionReference || null,
      paidAt: new Date(),
      notes: input.notes || null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "payment.record",
    entity: "Payment",
    entityId: payment.id,
    metadata: { requestId: request.id, amount: fee.amount.toString() },
  });

  await notifyFederalAdmins({
    type: "PAYMENT_TO_VERIFY_ADMIN",
    title: "Paiement à vérifier",
    message: `Un paiement de ${fee.amount} ${fee.currency} a été déclaré pour la demande ${request.number}.`,
    link: `/admin/payments/${payment.id}`,
  });

  return payment;
}

export async function listPayments(
  user: SessionUser,
  query: {
    status?: string;
    method?: string;
    clubId?: string;
    page: number;
    pageSize: number;
  },
) {
  assertCan(user, "payment.verify");

  const where: Prisma.PaymentWhereInput = {};
  if (query.status) where.status = query.status as Prisma.EnumPaymentStatusFilter["equals"];
  if (query.method) where.method = query.method as Prisma.EnumPaymentMethodFilter["equals"];
  if (query.clubId) where.clubId = query.clubId;

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        club: { select: { name: true } },
        athlete: { select: { firstName: true, lastName: true } },
        licenseRequest: { select: { number: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function verifyPayment(
  user: SessionUser,
  id: string,
  decision: "VERIFIED" | "REJECTED",
  notes?: string,
) {
  assertCan(user, "payment.verify");

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new NotFoundError("Paiement introuvable.");
  if (payment.status !== "PAID") {
    throw new ConflictError("Ce paiement n'est plus en attente de vérification.");
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: decision,
      verifiedAt: new Date(),
      verifiedById: user.id,
      notes: notes || payment.notes,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: decision === "VERIFIED" ? "payment.verify" : "payment.reject",
    entity: "Payment",
    entityId: id,
  });

  return updated;
}
