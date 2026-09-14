import type { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Administrateur",
  FEDERAL_ADMIN: "Administrateur Fédéral",
  AGENT: "Agent",
  CLUB_MANAGER: "Responsable de club",
  ATHLETE: "Athlète",
};
