import { NextResponse } from "next/server";

import {
  defaultBrief,
  defaultExtraction,
  type BriefResult,
  type ExtractionResult,
  type Mission,
} from "@/lib/sevasetu-data";
import { generateMissionBrief, generateReportExtraction } from "@/lib/sevasetu-ai";

type IntelligenceRequest =
  | {
      mode: "extract";
      report?: string;
    }
  | {
      mode: "brief";
      mission?: Mission;
    };

export async function POST(request: Request) {
  let body: IntelligenceRequest;

  try {
    body = (await request.json()) as IntelligenceRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (body.mode === "extract") {
    const report = body.report?.trim();

    if (!report) {
      return NextResponse.json({ error: "Report text is required." }, { status: 400 });
    }

    const extraction = await generateReportExtraction({ report });
    return NextResponse.json({
      ...defaultExtraction,
      ...extraction,
    } satisfies ExtractionResult);
  }

  if (!body.mission) {
    return NextResponse.json({ error: "Mission details are required." }, { status: 400 });
  }

  const brief = await generateMissionBrief(body.mission);

  return NextResponse.json({
    ...defaultBrief,
    ...brief,
  } satisfies BriefResult);
}
