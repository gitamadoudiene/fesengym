-- Garantit qu'une seule saison peut être marquée comme courante (ARCHITECTURE.md §10).
-- Prisma ne supporte pas les index partiels nativement dans schema.prisma.
CREATE UNIQUE INDEX "seasons_is_current_unique" ON "seasons" ("isCurrent") WHERE "isCurrent" = true;
