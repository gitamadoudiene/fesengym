import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { verifyPayment } from "@/lib/modules/payments/service";
import { verifyPaymentSchema } from "@/lib/modules/payments/schema";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/payments/[id]/verify">,
) {
  try {
    const user = await requireApiSessionUser();
    const { id } = await params;
    const { decision, notes } = verifyPaymentSchema.parse(await request.json());
    const payment = await verifyPayment(user, id, decision, notes);
    return NextResponse.json(payment);
  } catch (error) {
    return toErrorResponse(error);
  }
}
