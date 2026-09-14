import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { updateDiscipline } from "@/lib/modules/disciplines/service";
import { updateDisciplineSchema } from "@/lib/modules/disciplines/schema";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/disciplines/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const input = updateDisciplineSchema.parse(await request.json());
    const discipline = await updateDiscipline(user, id, input);
    return NextResponse.json(discipline);
  } catch (error) {
    return toErrorResponse(error);
  }
}
