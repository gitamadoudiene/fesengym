import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertCan, type SessionUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/modules/audit/service";
import { NotFoundError } from "@/lib/errors";
import type { CreateDisciplineInput, UpdateDisciplineInput } from "./schema";

export async function listDisciplines(user: SessionUser, { onlyActive = false } = {}) {
  assertCan(user, "settings.view");
  return prisma.discipline.findMany({
    where: onlyActive ? { active: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function createDiscipline(user: SessionUser, input: CreateDisciplineInput) {
  assertCan(user, "settings.manage");
  const discipline = await prisma.discipline.create({ data: input });
  await writeAuditLog({
    userId: user.id,
    action: "discipline.create",
    entity: "Discipline",
    entityId: discipline.id,
  });
  return discipline;
}

export async function updateDiscipline(
  user: SessionUser,
  id: string,
  input: UpdateDisciplineInput,
) {
  assertCan(user, "settings.manage");
  const existing = await prisma.discipline.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Discipline introuvable.");

  const discipline = await prisma.discipline.update({ where: { id }, data: input });
  await writeAuditLog({
    userId: user.id,
    action: "discipline.update",
    entity: "Discipline",
    entityId: discipline.id,
    metadata: input,
  });
  return discipline;
}
