import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createSeason, listSeasons } from "@/lib/modules/seasons/service";
import { createSeasonSchema } from "@/lib/modules/seasons/schema";

export async function GET() {
  try {
    const user = await requireApiSessionUser();
    const seasons = await listSeasons(user);
    return NextResponse.json(seasons);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = createSeasonSchema.parse(await request.json());
    const season = await createSeason(user, input);
    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
