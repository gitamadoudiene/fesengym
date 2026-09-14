import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { getClubById, updateClub, setClubStatus } from "@/lib/modules/clubs/service";
import { clubStatusSchema, updateClubSchema } from "@/lib/modules/clubs/schema";

export async function GET(_request: NextRequest, { params }: RouteContext<"/api/clubs/[id]">) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const club = await getClubById(user, id);
    return NextResponse.json(club);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/clubs/[id]">) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const body = await request.json();

    if (typeof body?.status === "string") {
      const input = clubStatusSchema.parse(body);
      const club = await setClubStatus(user, id, input.status, input.reason);
      return NextResponse.json(club);
    }

    const input = updateClubSchema.parse(body);
    const club = await updateClub(user, id, input);
    return NextResponse.json(club);
  } catch (error) {
    return toErrorResponse(error);
  }
}
