import type { UserRole } from "@prisma/client";

/**
 * Hiérarchie d'administration : SUPER_ADMIN > FEDERAL_ADMIN > AGENT.
 * CLUB_MANAGER et ATHLETE ne sont jamais comparés à cette hiérarchie : leur
 * portée est toujours limitée à leurs propres données (clubId / athleteId),
 * jamais à un niveau d'autorité sur d'autres utilisateurs.
 */
const ADMIN_RANK: Partial<Record<UserRole, number>> = {
  SUPER_ADMIN: 3,
  FEDERAL_ADMIN: 2,
  AGENT: 1,
};

export function isAdminRole(role: UserRole): boolean {
  return role in ADMIN_RANK;
}

export function hasAdminRankAtLeast(role: UserRole, minimum: UserRole): boolean {
  const roleRank = ADMIN_RANK[role];
  const minRank = ADMIN_RANK[minimum];
  if (roleRank === undefined || minRank === undefined) return false;
  return roleRank >= minRank;
}

export type SessionUser = {
  id: string;
  role: UserRole;
  clubId: string | null;
  athleteId: string | null;
};

export type Action =
  | "club.manage" // créer/modifier/désactiver un club
  | "club.view"
  | "athlete.manage" // créer/modifier un athlète
  | "athlete.view"
  | "request.create"
  | "request.review" // vérifier un dossier (agent)
  | "request.decide" // valider/rejeter (admin fédéral/super admin)
  | "payment.record" // enregistrer un paiement (club)
  | "payment.verify" // vérifier un paiement (admin/agent)
  | "license.view"
  | "license.suspend"
  | "settings.manage" // saisons, disciplines, catégories, tarifs — Super Admin uniquement
  | "settings.view" // lecture des référentiels (nécessaire pour créer athlètes/demandes)
  | "users.manage"
  | "audit.view"
  | "card.order" // club : commander une carte physique
  | "card.manage"; // admin : mettre à jour le statut d'une commande

/**
 * Vérifie qu'un utilisateur peut effectuer une action, indépendamment de la
 * portée club (voir requireOwnClub ci-dessous pour l'isolation des données).
 * Cette fonction doit être appelée depuis chaque service, jamais uniquement
 * depuis une route ou un composant — voir ARCHITECTURE.md §6.
 */
export function can(user: SessionUser, action: Action): boolean {
  switch (action) {
    // Réservé au Super Admin uniquement
    case "users.manage":
    case "settings.manage":
      return hasAdminRankAtLeast(user.role, "SUPER_ADMIN");

    // Administration fédérale (Super Admin + Admin Fédéral) — actions
    // sensibles de validation finale, hors de portée d'un Agent (brief §4).
    case "club.manage":
    case "request.decide":
    case "payment.verify":
    case "license.suspend":
    case "audit.view":
      return hasAdminRankAtLeast(user.role, "FEDERAL_ADMIN");

    // Toute l'administration, y compris les agents (lecture / préparation)
    case "request.review":
      return isAdminRole(user.role);

    // Consultation partagée : administration + club (sur ses propres données,
    // filtrées par scopedClubId) + athlète (sur ses propres données)
    case "club.view":
    case "athlete.view":
    case "license.view":
    case "settings.view":
      return isAdminRole(user.role) || user.role === "CLUB_MANAGER" || user.role === "ATHLETE";

    // Actions club (création de dossiers / athlètes / paiements)
    case "athlete.manage":
    case "request.create":
    case "payment.record":
    case "card.order":
      return isAdminRole(user.role) || user.role === "CLUB_MANAGER";

    case "card.manage":
      return hasAdminRankAtLeast(user.role, "FEDERAL_ADMIN");

    default:
      return false;
  }
}

/**
 * Isolation des clubs (ARCHITECTURE.md §6 / §30) : un CLUB_MANAGER ne peut
 * agir que sur son propre clubId. Les rôles d'administration (SUPER_ADMIN,
 * FEDERAL_ADMIN, AGENT) voient tous les clubs. Un ATHLETE n'a pas de portée
 * club directe (utiliser requireOwnAthlete).
 *
 * Retourne le clubId à appliquer comme filtre obligatoire dans la requête,
 * ou `null` si l'utilisateur n'est pas restreint (rôle d'administration).
 * Lève une erreur si un CLUB_MANAGER n'a pas de clubId (état incohérent).
 */
export function scopedClubId(user: SessionUser): string | null {
  if (user.role === "CLUB_MANAGER") {
    if (!user.clubId) {
      throw new Error("Utilisateur CLUB_MANAGER sans club associé.");
    }
    return user.clubId;
  }
  return null;
}

export class ForbiddenError extends Error {
  constructor(message = "Action non autorisée.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertCan(user: SessionUser, action: Action): void {
  if (!can(user, action)) {
    throw new ForbiddenError();
  }
}
