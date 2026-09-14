import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { rejectRequest } from "@/lib/modules/licenseRequests/service";
import { rejectRequestSchema } from "@/lib/modules/licenseRequests/schema";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/requests/[id]/reject">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { reason } = rejectRequestSchema.parse(await request.json());
    const result = await rejectRequest(user, id, reason);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
