"use client";

import { trackProductEvent } from "./api";
import type { LaunchEventName } from "./types";

export async function trackLaunchEvent(input: {
  readonly name: LaunchEventName;
  readonly source: string;
  readonly token?: string | null;
  readonly projectId?: string;
}) {
  try {
    await trackProductEvent({
      name: input.name,
      source: input.source,
      ...(input.token ? { token: input.token } : {}),
      ...(input.projectId ? { projectId: input.projectId } : {})
    });
  } catch {
    // Launch tracking should never block the primary product action.
  }
}
