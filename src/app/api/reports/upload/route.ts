import { NextResponse } from "next/server";

import { createImageReport } from "@/lib/sevasetu-store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const note = String(formData.get("note") || "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }

  try {
    const result = await createImageReport({
      rawText: note.trim(),
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
