import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createClub, listClubs } from "@/lib/modules/clubs/service";
import { createClubSchema, listClubsQuerySchema } from "@/lib/modules/clubs/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = listClubsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listClubs(user, query);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const body = await request.json();
    const input = createClubSchema.parse(body);
    const club = await createClub(user, input);
    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
