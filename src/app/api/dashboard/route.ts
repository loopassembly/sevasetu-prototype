import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/sevasetu-store";

export async function GET() {
  try {
    const dashboard = await getDashboardData();
    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
