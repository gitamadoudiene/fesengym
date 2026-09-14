import "server-only";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/errors";
import type { RequestType } from "@prisma/client";

/**
 * Tarification configurable (brief §60) — jamais de montant hardcodé côté
 * frontend. Résolution du tarif le plus spécifique disponible : d'abord
 * saison + catégorie + discipline + type, puis on relâche progressivement
 * discipline puis type.
 */
export async function getApplicableFee(params: {
  seasonId: string;
  categoryId: string;
  disciplineId: string;
  type: RequestType;
}) {
  const candidates = await prisma.licenseFee.findMany({
    where: {
      seasonId: params.seasonId,
      categoryId: params.categoryId,
      OR: [{ disciplineId: params.disciplineId }, { disciplineId: null }],
    },
  });

  const exact = candidates.find(
    (f) => f.disciplineId === params.disciplineId && f.requestType === params.type,
  );
  if (exact) return exact;

  const byCategoryAndType = candidates.find(
    (f) => f.disciplineId === null && f.requestType === params.type,
  );
  if (byCategoryAndType) return byCategoryAndType;

  const anyForCategory = candidates[0];
  if (anyForCategory) return anyForCategory;

  throw new NotFoundError(
    "Aucun tarif configuré pour cette catégorie/saison. Contactez l'administration.",
  );
}
