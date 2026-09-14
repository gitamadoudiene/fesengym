import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createUser, listUsers } from "@/lib/modules/users/service";
import { createUserSchema } from "@/lib/modules/users/schema";

export async function GET() {
  try {
    const user = await requireApiSessionUser();
    const users = await listUsers(user);
    return NextResponse.json(users);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = createUserSchema.parse(await request.json());
    const created = await createUser(user, input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
