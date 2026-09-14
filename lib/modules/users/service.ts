import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { assertCan, type SessionUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type { CreateUserInput, UpdateUserInput } from "./schema";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Authentifie un utilisateur par email/mot de passe. Ne révèle jamais si
 * c'est l'email ou le mot de passe qui est invalide (évite l'énumération
 * de comptes) et refuse les comptes non ACTIVE.
 */
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
}

export async function listUsers(user: SessionUser) {
  assertCan(user, "users.manage");
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
    include: { club: { select: { id: true, name: true } } },
  });
}

export async function createUser(user: SessionUser, input: CreateUserInput) {
  assertCan(user, "users.manage");

  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new ConflictError("Un utilisateur avec cet email existe déjà.");

  if (input.role === "CLUB_MANAGER") {
    if (!input.clubId) throw new ValidationError("Le club est requis.");
    const club = await prisma.club.findUnique({ where: { id: input.clubId } });
    if (!club) throw new NotFoundError("Club introuvable.");
  }

  const created = await prisma.user.create({
    data: {
      email: input.email.toLowerCase().trim(),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      clubId: input.role === "CLUB_MANAGER" ? input.clubId : null,
      passwordHash: await hashPassword(input.password),
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "user.create",
    entity: "User",
    entityId: created.id,
    metadata: { email: created.email, role: created.role },
  });

  return created;
}

export async function updateUser(user: SessionUser, id: string, input: UpdateUserInput) {
  assertCan(user, "users.manage");

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Utilisateur introuvable.");
  if (existing.id === user.id && input.status && input.status !== "ACTIVE") {
    throw new ValidationError("Vous ne pouvez pas désactiver votre propre compte.");
  }

  const updated = await prisma.user.update({ where: { id }, data: input });

  await writeAuditLog({
    userId: user.id,
    action: "user.update",
    entity: "User",
    entityId: id,
    metadata: input,
  });

  return updated;
}

export async function resetUserPassword(user: SessionUser, id: string, newPassword: string) {
  assertCan(user, "users.manage");

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Utilisateur introuvable.");

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await writeAuditLog({
    userId: user.id,
    action: "user.reset_password",
    entity: "User",
    entityId: id,
  });
}
