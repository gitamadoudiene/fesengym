import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createAthlete, listAthletes } from "@/lib/modules/athletes/service";
import { createAthleteSchema, listAthletesQuerySchema } from "@/lib/modules/athletes/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = listAthletesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listAthletes(user, query);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = createAthleteSchema.parse(await request.json());
    const athlete = await createAthlete(user, input);
    return NextResponse.json(athlete, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
