import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { findPotentialDuplicates } from "@/lib/modules/athletes/service";
import { duplicateCheckSchema } from "@/lib/modules/athletes/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = duplicateCheckSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const matches = await findPotentialDuplicates(user, query);
    return NextResponse.json(matches);
  } catch (error) {
    return toErrorResponse(error);
  }
}
