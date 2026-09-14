import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createRequest, listRequests } from "@/lib/modules/licenseRequests/service";
import { createRequestSchema, listRequestsQuerySchema } from "@/lib/modules/licenseRequests/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = listRequestsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listRequests(user, query);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = createRequestSchema.parse(await request.json());
    const created = await createRequest(user, input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
