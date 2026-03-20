import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { webEnv } from "../../../lib/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { rating?: string; comment?: string | null; page?: string };
    if (!body.rating || !["up", "down"].includes(body.rating)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }
    // Forward to the backend feedback endpoint
    await fetch(new URL("/v1/feedback", webEnv.apiBaseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Anonymous",
        email: "anonymous@fyxvo.user",
        category: body.rating === "up" ? "PRODUCT_FEEDBACK" : "ONBOARDING_FRICTION",
        message: body.comment ?? `Page ${body.page ?? "unknown"}: ${body.rating}`,
        page: body.page ?? null,
        role: "developer",
      }),
    });
    return NextResponse.json({ success: true });
  } catch {
    // Silent fail — feedback is non-critical
    return NextResponse.json({ success: true });
  }
}
