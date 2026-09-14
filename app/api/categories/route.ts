import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createCategory, listCategories } from "@/lib/modules/categories/service";
import { createCategorySchema } from "@/lib/modules/categories/schema";

export async function GET() {
  try {
    const user = await requireApiSessionUser();
    const categories = await listCategories(user);
    return NextResponse.json(categories);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = createCategorySchema.parse(await request.json());
    const category = await createCategory(user, input);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
