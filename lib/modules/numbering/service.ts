import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { SequenceType } from "@prisma/client";

const PREFIXES: Record<SequenceType, string> = {
  REQUEST: "REQ",
  LICENSE: "FSG",
  CLUB: "CLB",
  PAYMENT: "PAY",
};

// Les codes club ne sont pas rattachés à une année (contrairement aux
// demandes/licences) : on utilise un compartiment fixe (year=0) dans la
// même table de séquence.
const CLUB_SEQUENCE_YEAR = 0;

/**
 * Génère un numéro unique et lisible (ex: REQ-2026-000124, FSG-2026-001245).
 *
 * Atomicité : voir ARCHITECTURE.md §7 / DECISIONS.md D7 — l'UPDATE sur la
 * ligne (type, year) prend un verrou de ligne Postgres, ce qui sérialise les
 * requêtes concurrentes sans mécanisme externe. Le "upsert" gère la création
 * de la première ligne de l'année.
 */
export async function generateNumber(
  type: SequenceType,
  year: number,
  seasonId?: string,
): Promise<string> {
  const sequence = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findUnique({
      where: { type_year: { type, year } },
    });

    if (!existing) {
      return tx.numberSequence.create({
        data: { type, year, lastNumber: 1, seasonId },
      });
    }

    return tx.numberSequence.update({
      where: { id: existing.id },
      data: { lastNumber: { increment: 1 } },
    });
  });

  const padded = String(sequence.lastNumber).padStart(6, "0");
  if (type === "CLUB") {
    return `${PREFIXES[type]}-${padded}`;
  }
  return `${PREFIXES[type]}-${year}-${padded}`;
}

export async function generateRequestNumber(year: number, seasonId?: string) {
  return generateNumber("REQUEST", year, seasonId);
}

export async function generateLicenseNumber(year: number, seasonId?: string) {
  return generateNumber("LICENSE", year, seasonId);
}

export async function generateClubCode() {
  return generateNumber("CLUB", CLUB_SEQUENCE_YEAR);
}

export async function generatePaymentReference(year: number) {
  return generateNumber("PAYMENT", year);
}
