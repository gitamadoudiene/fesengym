import { NextResponse } from "next/server";
import { getPublicLicensePhoto } from "@/lib/modules/licenses/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/public/verify/[number]/photo">,
) {
  const { number } = await params;
  const photo = await getPublicLicensePhoto(number);
  if (!photo) {
    return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(photo.buffer), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
