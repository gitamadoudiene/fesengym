import { NextResponse, type NextRequest } from "next/server";
import { requireApiSessionUser } from "@/lib/auth/dal";
import { toErrorResponse } from "@/lib/errors";
import { listPayments, recordPayment } from "@/lib/modules/payments/service";
import { listPaymentsQuerySchema, recordPaymentSchema } from "@/lib/modules/payments/schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const query = listPaymentsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listPayments(user, query);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSessionUser();
    const input = recordPaymentSchema.parse(await request.json());
    const payment = await recordPayment(user, input);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
