import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SessionUser } from "@/lib/auth/permissions";
import { UnauthorizedError } from "@/lib/errors";

/**
 * Data Access Layer — voir node_modules/next/dist/docs/.../authentication.md
 * "Creating a Data Access Layer (DAL)". Toute page, Server Action ou route
 * qui a besoin de la session doit passer par ici, jamais lire le JWT
 * directement. `cache()` mémoïse l'appel pour la durée du rendu.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    role: session.user.role,
    clubId: session.user.clubId,
    athleteId: session.user.athleteId,
  };
});

/**
 * À utiliser dans les Server Components / Route Handlers qui exigent une
 * session valide. Redirige vers /login si absente (jamais un simple `null`
 * silencieux — voir le "Good to know" de la doc sur les faux-positifs de
 * sécurité dans les layouts).
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Variante pour les Route Handlers (app/api/**): une réponse JSON 401 est
 * attendue, jamais une redirection HTML — voir toErrorResponse().
 */
export async function requireApiSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
