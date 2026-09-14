import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { getAthleteById, updateAthlete } from "@/lib/modules/athletes/service";
import { updateAthleteSchema } from "@/lib/modules/athletes/schema";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/athletes/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const athlete = await getAthleteById(user, id);
    return NextResponse.json(athlete);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/athletes/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const input = updateAthleteSchema.parse(await request.json());
    const athlete = await updateAthlete(user, id, input);
    return NextResponse.json(athlete);
  } catch (error) {
    return toErrorResponse(error);
  }
}
