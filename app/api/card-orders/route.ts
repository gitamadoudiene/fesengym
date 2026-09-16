import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { createCardOrder, listCardOrders } from "@/lib/modules/cardOrders/service";
import { createCardOrderSchema, listCardOrdersQuerySchema } from "@/lib/modules/cardOrders/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = listCardOrdersQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listCardOrders(user, query);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const { licenseId } = createCardOrderSchema.parse(await request.json());
    const order = await createCardOrder(user, licenseId);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
