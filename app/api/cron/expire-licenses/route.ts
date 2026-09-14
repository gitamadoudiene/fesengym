import { NextResponse } from "next/server";
import { runExpireLicensesJob } from "@/lib/jobs/expireLicenses";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await runExpireLicensesJob();
  return NextResponse.json(result);
}
