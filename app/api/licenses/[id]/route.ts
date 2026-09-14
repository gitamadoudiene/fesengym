import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { getLicenseById } from "@/lib/modules/licenses/service";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/licenses/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const license = await getLicenseById(user, id);
    return NextResponse.json(license);
  } catch (error) {
    return toErrorResponse(error);
  }
}
