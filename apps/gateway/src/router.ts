import { NodeStatus } from "@fyxvo/database";
import type { RoutedRpcNode, RoutedUpstreamResponse, RoutingMode, UpstreamRouter } from "./types.js";

function nodePriority(node: RoutedRpcNode, mode: RoutingMode): number {
  const isProjectSpecific = node.projectId !== null;
  const isOnline = node.status === NodeStatus.ONLINE;

  if (mode === "priority") {
    if (isProjectSpecific && isOnline) {
      return 0;
    }
    if (!isProjectSpecific && isOnline) {
      return 1;
    }
    if (isProjectSpecific) {
      return 2;
    }
    return 3;
  }

  if (isOnline && isProjectSpecific) {
    return 0;
  }
  if (isOnline) {
    return 1;
  }
  if (isProjectSpecific) {
    return 2;
  }
  return 3;
}

function sortNodes(nodes: readonly RoutedRpcNode[], mode: RoutingMode): RoutedRpcNode[] {
  return [...nodes].sort((left, right) => {
    const priorityDelta = nodePriority(left, mode) - nodePriority(right, mode);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const leftHeartbeat = left.lastHeartbeatAt?.getTime() ?? 0;
    const rightHeartbeat = right.lastHeartbeatAt?.getTime() ?? 0;
    return rightHeartbeat - leftHeartbeat;
  });
}

export class HttpUpstreamRouter implements UpstreamRouter {
  private readonly cursors = new Map<string, number>();
  private readonly failureCooldownMs: number;
  private readonly failedUntil = new Map<string, number>();

  constructor(input: { readonly failureCooldownMs: number }) {
    this.failureCooldownMs = input.failureCooldownMs;
  }

  private keyFor(nodes: readonly RoutedRpcNode[], mode: RoutingMode): string {
    return `${mode}:${nodes.map((node) => node.id).join(",")}`;
  }

  private rotate(nodes: readonly RoutedRpcNode[], mode: RoutingMode): RoutedRpcNode[] {
    if (nodes.length <= 1) {
      return [...nodes];
    }

    const key = this.keyFor(nodes, mode);
    const start = this.cursors.get(key) ?? 0;
    this.cursors.set(key, (start + 1) % nodes.length);
    return [...nodes.slice(start), ...nodes.slice(0, start)];
  }

  private withCooldownAwareness(nodes: readonly RoutedRpcNode[], mode: RoutingMode): RoutedRpcNode[] {
    const now = Date.now();
    const healthy = nodes.filter((node) => (this.failedUntil.get(node.id) ?? 0) <= now);
    const coolingDown = nodes.filter((node) => (this.failedUntil.get(node.id) ?? 0) > now);

    if (mode === "priority" && healthy.length > 0) {
      return healthy;
    }

    return [...healthy, ...coolingDown];
  }

  private async forward(input: {
    readonly node: RoutedRpcNode;
    readonly serializedBody: string;
    readonly timeoutMs: number;
  }) {
    const response = await fetch(input.node.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: input.serializedBody,
      signal: AbortSignal.timeout(input.timeoutMs)
    });
    const rawBody = await response.text();

    if (response.status >= 500) {
      throw new Error(`Upstream node ${input.node.endpoint} returned ${response.status}.`);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      throw new Error(
        `Upstream node ${input.node.endpoint} returned invalid JSON: ${
          error instanceof Error ? error.message : "unknown parse failure"
        }`
      );
    }

    return {
      statusCode: response.status,
      rawBody,
      body
    };
  }

  async route(input: {
    readonly mode: RoutingMode;
    readonly payload: unknown;
    readonly serializedBody: string;
    readonly nodes: readonly RoutedRpcNode[];
    readonly timeoutMs: number;
  }): Promise<RoutedUpstreamResponse> {
    const orderedNodes = this.rotate(
      this.withCooldownAwareness(sortNodes(input.nodes, input.mode), input.mode),
      input.mode
    );
    const failures: string[] = [];

    for (const node of orderedNodes) {
      try {
        const response = await this.forward({
          node,
          serializedBody: input.serializedBody,
          timeoutMs: input.timeoutMs
        });
        this.failedUntil.delete(node.id);

        return {
          node,
          statusCode: response.statusCode,
          body: response.body,
          rawBody: response.rawBody,
          hasJsonRpcError: Array.isArray(response.body)
            ? response.body.some(
                (entry) => typeof entry === "object" && entry !== null && "error" in entry
              )
            : typeof response.body === "object" && response.body !== null && "error" in response.body
        };
      } catch (error) {
        this.failedUntil.set(node.id, Date.now() + this.failureCooldownMs);
        failures.push(
          `${node.name} (${node.endpoint}): ${error instanceof Error ? error.message : "unknown upstream error"}`
        );
      }
    }

    throw new Error(`All upstream nodes failed. ${failures.join(" | ")}`);
  }

  async ping(nodes: readonly RoutedRpcNode[], timeoutMs: number): Promise<boolean> {
    const candidates = this.withCooldownAwareness(sortNodes(nodes, "priority"), "priority");
    const candidate = candidates[0];
    if (!candidate) {
      return false;
    }

    const response = await fetch(candidate.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health",
        method: "getHealth"
      }),
      signal: AbortSignal.timeout(timeoutMs)
    }).catch(() => null);

    return !!response?.ok;
  }
}
