import { NextResponse } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { approveClubApplication } from "@/lib/modules/clubApplications/service";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/clubs/[id]/approve">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const club = await approveClubApplication(user, id);
    return NextResponse.json(club);
  } catch (error) {
    return toErrorResponse(error);
  }
}
