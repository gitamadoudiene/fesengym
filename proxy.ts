import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Contrôle optimiste (lecture du JWT en cookie uniquement, pas de requête DB
 * — voir node_modules/next/dist/docs/.../authentication.md "Optimistic
 * checks with Proxy"). La vérification définitive des permissions et de
 * l'isolation club se fait dans chaque service (lib/modules/*), jamais ici.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/verify-license",
  "/api/auth",
  "/api/public",
  "/api/cron",
  "/api/club-applications",
  "/api/storage-check",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
