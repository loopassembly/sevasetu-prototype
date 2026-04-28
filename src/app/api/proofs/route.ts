import { NextResponse } from "next/server";

import { createProof } from "@/lib/sevasetu-store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const missionId = String(formData.get("missionId") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const volunteerName = String(formData.get("volunteerName") || "Volunteer").trim();
  const file = formData.get("file");

  if (!missionId) {
    return NextResponse.json({ error: "missionId is required." }, { status: 400 });
  }

  try {
    const result = await createProof({
      missionId,
      note,
      volunteerName,
      fileBuffer: file instanceof File ? Buffer.from(await file.arrayBuffer()) : undefined,
      fileName: file instanceof File ? file.name : undefined,
      mimeType: file instanceof File ? file.type || "application/octet-stream" : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create proof.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
