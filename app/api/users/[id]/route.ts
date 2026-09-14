import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { updateUser } from "@/lib/modules/users/service";
import { updateUserSchema } from "@/lib/modules/users/schema";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/users/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const input = updateUserSchema.parse(await request.json());
    const updated = await updateUser(user, id, input);
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
