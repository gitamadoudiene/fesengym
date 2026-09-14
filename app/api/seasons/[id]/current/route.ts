import { NextResponse } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { setCurrentSeason } from "@/lib/modules/seasons/service";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/seasons/[id]/current">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const season = await setCurrentSeason(user, id);
    return NextResponse.json(season);
  } catch (error) {
    return toErrorResponse(error);
  }
}
