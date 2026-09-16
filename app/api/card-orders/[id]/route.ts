import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { updateCardOrderStatus } from "@/lib/modules/cardOrders/service";
import { updateCardOrderStatusSchema } from "@/lib/modules/cardOrders/schema";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/card-orders/[id]">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { status, trackingReference } = updateCardOrderStatusSchema.parse(
      await request.json(),
    );
    const order = await updateCardOrderStatus(user, id, status, trackingReference);
    return NextResponse.json(order);
  } catch (error) {
    return toErrorResponse(error);
  }
}
