import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse, ValidationError } from "@/lib/errors";
import { listDocumentsForOwner, uploadDocument } from "@/lib/modules/documents/service";
import type { DocumentOwnerType, DocumentType } from "@prisma/client";

const OWNER_TYPES: DocumentOwnerType[] = ["ATHLETE", "CLUB", "LICENSE_REQUEST", "PAYMENT"];
const DOC_TYPES: DocumentType[] = [
  "PHOTO",
  "MEDICAL_CERTIFICATE",
  "PROOF_OF_IDENTITY",
  "PAYMENT_PROOF",
  "ADMINISTRATIVE",
  "OTHER",
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const ownerType = request.nextUrl.searchParams.get("ownerType") as DocumentOwnerType | null;
    const ownerId = request.nextUrl.searchParams.get("ownerId");
    if (!ownerType || !ownerId || !OWNER_TYPES.includes(ownerType)) {
      throw new ValidationError("ownerType et ownerId sont requis.");
    }
    const documents = await listDocumentsForOwner(user, ownerType, ownerId);
    return NextResponse.json(documents);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const formData = await request.formData();

    const ownerType = formData.get("ownerType") as DocumentOwnerType | null;
    const ownerId = formData.get("ownerId") as string | null;
    const type = formData.get("type") as DocumentType | null;
    const file = formData.get("file") as File | null;

    if (!ownerType || !OWNER_TYPES.includes(ownerType)) {
      throw new ValidationError("Type de propriétaire invalide.");
    }
    if (!ownerId) throw new ValidationError("ownerId est requis.");
    if (!type || !DOC_TYPES.includes(type)) throw new ValidationError("Type de document invalide.");
    if (!file || !(file instanceof File)) throw new ValidationError("Fichier requis.");

    const document = await uploadDocument(user, { ownerType, ownerId, type, file });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
