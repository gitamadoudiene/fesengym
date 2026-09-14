import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { listLicenses } from "@/lib/modules/licenses/service";
import { listLicensesQuerySchema } from "@/lib/modules/licenses/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = listLicensesQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listLicenses(user, query);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
