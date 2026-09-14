import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { getRequestById } from "@/lib/modules/licenseRequests/service";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/requests/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const item = await getRequestById(user, id);
    return NextResponse.json(item);
  } catch (error) {
    return toErrorResponse(error);
  }
}
