import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { updateCategory } from "@/lib/modules/categories/service";
import { updateCategorySchema } from "@/lib/modules/categories/schema";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/categories/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const input = updateCategorySchema.parse(await request.json());
    const category = await updateCategory(user, id, input);
    return NextResponse.json(category);
  } catch (error) {
    return toErrorResponse(error);
  }
}
