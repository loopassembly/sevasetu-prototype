import { NextResponse } from "next/server";

import { createTextReport } from "@/lib/sevasetu-store";

export async function POST(request: Request) {
  let body: { rawText?: string };

  try {
    body = (await request.json()) as { rawText?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const rawText = body.rawText?.trim();

  if (!rawText) {
    return NextResponse.json({ error: "Report text is required." }, { status: 400 });
  }

  try {
    const result = await createTextReport({ rawText });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
