import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertCan, type SessionUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { NotFoundError } from "@/lib/errors";
import type { CreateCategoryInput, UpdateCategoryInput } from "./schema";

export async function listCategories(user: SessionUser, { onlyActive = false } = {}) {
  assertCan(user, "settings.view");
  return prisma.category.findMany({
    where: onlyActive ? { active: true } : undefined,
    include: { discipline: { select: { id: true, name: true, code: true } } },
    orderBy: [{ minAge: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(user: SessionUser, input: CreateCategoryInput) {
  assertCan(user, "settings.manage");
  const category = await prisma.category.create({
    data: {
      name: input.name,
      disciplineId: input.disciplineId || null,
      minAge: input.minAge,
      maxAge: input.maxAge,
      sex: input.sex,
    },
  });
  await writeAuditLog({
    userId: user.id,
    action: "category.create",
    entity: "Category",
    entityId: category.id,
  });
  return category;
}

export async function updateCategory(
  user: SessionUser,
  id: string,
  input: UpdateCategoryInput,
) {
  assertCan(user, "settings.manage");
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Catégorie introuvable.");

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...input,
      disciplineId: input.disciplineId === "" ? null : input.disciplineId,
    },
  });
  await writeAuditLog({
    userId: user.id,
    action: "category.update",
    entity: "Category",
    entityId: category.id,
  });
  return category;
}
