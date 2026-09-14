import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createDiscipline, listDisciplines } from "@/lib/modules/disciplines/service";
import { createDisciplineSchema } from "@/lib/modules/disciplines/schema";

export async function GET() {
  try {
    const user = await requireApiSessionUser();
    const disciplines = await listDisciplines(user);
    return NextResponse.json(disciplines);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = createDisciplineSchema.parse(await request.json());
    const discipline = await createDiscipline(user, input);
    return NextResponse.json(discipline, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
