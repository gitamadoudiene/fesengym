import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { rejectClubApplication } from "@/lib/modules/clubApplications/service";
import { clubApplicationDecisionSchema } from "@/lib/modules/clubApplications/schema";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/clubs/[id]/reject">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { reason } = clubApplicationDecisionSchema.parse(await request.json());
    const club = await rejectClubApplication(user, id, reason || "Non précisé");
    return NextResponse.json(club);
  } catch (error) {
    return toErrorResponse(error);
  }
}
