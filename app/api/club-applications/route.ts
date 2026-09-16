import { NextResponse, type NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { submitClubApplication } from "@/lib/modules/clubApplications/service";
import { createClubApplicationSchema } from "@/lib/modules/clubApplications/schema";

const DOCUMENT_FIELDS = ["statuts", "recepisse", "listeBureau", "autre"] as const;

/**
 * Route publique — aucune authentification requise (voir proxy.ts). C'est
 * la seule mutation de l'application accessible sans session.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const input = createClubApplicationSchema.parse({
      name: formData.get("name"),
      acronym: formData.get("acronym") || undefined,
      address: formData.get("address") || undefined,
      city: formData.get("city"),
      region: formData.get("region"),
      phone: formData.get("phone"),
      presidentName: formData.get("presidentName"),
      managerFirstName: formData.get("managerFirstName"),
      managerLastName: formData.get("managerLastName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const documents: { type: string; file: File }[] = [];
    for (const field of DOCUMENT_FIELDS) {
      const file = formData.get(field);
      if (file instanceof File && file.size > 0) {
        documents.push({ type: "ADMINISTRATIVE", file });
      }
    }

    const club = await submitClubApplication(input, documents);
    return NextResponse.json({ id: club.id, code: club.code }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
