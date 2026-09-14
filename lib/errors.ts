import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ForbiddenError } from "@/lib/auth/permissions";

export class UnauthorizedError extends Error {
  constructor(message = "Authentification requise.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Ressource introuvable.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends Error {
  constructor(message = "Données invalides.") {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Traduit toute erreur (métier ou technique) en réponse HTTP sûre — jamais
 * de message Prisma/DB brut exposé au client (brief §37). Les erreurs
 * inattendues sont journalisées côté serveur et renvoient un message
 * générique.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Données invalides.", details: error.flatten() },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Cette valeur existe déjà (contrainte d'unicité)." },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Ressource introuvable." },
        { status: 404 },
      );
    }
  }

  console.error("[unhandled-error]", error);
  return NextResponse.json(
    { error: "Une erreur inattendue est survenue." },
    { status: 500 },
  );
}
