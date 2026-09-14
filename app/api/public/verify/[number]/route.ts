import { NextResponse } from "next/server";
import { getPublicLicenseView } from "@/lib/modules/licenses/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/public/verify/[number]">,
) {
  const { number } = await params;
  const license = await getPublicLicenseView(number);
  if (!license) {
    return NextResponse.json({ error: "Licence introuvable." }, { status: 404 });
  }
  return NextResponse.json(license);
}
