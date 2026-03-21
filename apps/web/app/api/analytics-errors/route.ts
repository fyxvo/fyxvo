import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { webEnv } from "../../../lib/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { component?: string; message?: string; page?: string };
    if (!body.component && !body.message) {
      return NextResponse.json({ error: "Missing component or message" }, { status: 400 });
    }
    await fetch(new URL("/v1/analytics/errors", webEnv.apiBaseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        component: body.component ?? "unknown",
        message: body.message ?? "unknown",
        page: body.page ?? "unknown",
      }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // silent fail — never block the client
  }
}
