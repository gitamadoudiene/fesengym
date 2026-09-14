import { NextResponse } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { startReview } from "@/lib/modules/licenseRequests/service";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/requests/[id]/review">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const result = await startReview(user, id);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
