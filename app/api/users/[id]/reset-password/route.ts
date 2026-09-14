import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { resetUserPassword } from "@/lib/modules/users/service";
import { resetPasswordSchema } from "@/lib/modules/users/schema";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/users/[id]/reset-password">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { password } = resetPasswordSchema.parse(await request.json());
    await resetUserPassword(user, id, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
