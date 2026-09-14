import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { requestCorrection } from "@/lib/modules/licenseRequests/service";
import { correctionRequestSchema } from "@/lib/modules/licenseRequests/schema";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/requests/[id]/correction">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { reason } = correctionRequestSchema.parse(await request.json());
    const result = await requestCorrection(user, id, reason);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
