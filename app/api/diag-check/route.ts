import { NextResponse } from "next/server";

/**
 * Route de diagnostic TEMPORAIRE — ne révèle aucune valeur de secret, juste
 * leur présence/absence, pour déboguer l'erreur Auth.js "server
 * configuration" en production. À SUPPRIMER une fois le problème résolu.
 */
export async function GET() {
  return NextResponse.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasAuthUrl: !!process.env.AUTH_URL,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    isVercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });
}
