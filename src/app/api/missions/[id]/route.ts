import { NextResponse } from "next/server";

import { type MissionStatus } from "@/lib/sevasetu-data";
import { updateMissionStatus } from "@/lib/sevasetu-store";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  let body: { status?: MissionStatus };

  try {
    body = (await request.json()) as { status?: MissionStatus };
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json({ error: "Mission status is required." }, { status: 400 });
  }

  try {
    const mission = await updateMissionStatus({
      missionId: id,
      status: body.status,
    });

    return NextResponse.json(mission);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update mission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
