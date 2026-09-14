import { NextResponse } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { reactivateLicense } from "@/lib/modules/licenses/service";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/licenses/[id]/reactivate">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const license = await reactivateLicense(user, id);
    return NextResponse.json(license);
  } catch (error) {
    return toErrorResponse(error);
  }
}
