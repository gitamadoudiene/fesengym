import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { suspendLicense } from "@/lib/modules/licenses/service";
import { suspendLicenseSchema } from "@/lib/modules/licenses/schema";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/licenses/[id]/suspend">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { reason } = suspendLicenseSchema.parse(await request.json());
    const license = await suspendLicense(user, id, reason);
    return NextResponse.json(license);
  } catch (error) {
    return toErrorResponse(error);
  }
}
