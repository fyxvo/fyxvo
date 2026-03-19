import { afterEach, describe, expect, it } from "vitest";
import { NodeStatus } from "@fyxvo/database";
import { loadWorkerEnv } from "@fyxvo/config";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { processWalletIndexing } from "../src/jobs/indexing.js";
import { processMetricsAggregation } from "../src/jobs/metrics.js";
import { processNodeHealthMonitoring } from "../src/jobs/node-health.js";
import { processRewardCalculation } from "../src/jobs/rewards.js";
import { JsonRpcNodeProbeClient } from "../src/solana.js";
import type {
  ManagedNode,
  NativeBalanceSnapshot,
  NodeHealthCheckRecord,
  ParsedTransactionRecord,
  RequestLogRecord,
  RewardSnapshotInput,
  SignatureSummary,
  SolanaIndexerClient,
  TokenBalanceSnapshot,
  TransactionLookupRecord,
  UsageRollupMutation,
  WalletActivityMutation,
  WalletIndexTarget,
  WorkerLogger,
  WorkerRepository
} from "../src/types.js";

function makeEnv(overrides: Partial<Record<string, string>> = {}) {
  return loadWorkerEnv({
    FYXVO_ENV: "test",
    LOG_LEVEL: "error",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/fyxvo_test",
    REDIS_URL: "redis://localhost:6379",
    SOLANA_CLUSTER: "devnet",
    SOLANA_RPC_URL: "https://api.devnet.solana.com",
    SOLANA_WS_URL: "wss://api.devnet.solana.com",
    REQUEST_TIMEOUT_MS: "5000",
    WORKER_NAME: "fyxvo-worker-test",
    WORKER_INTERVAL_MS: "5000",
    WORKER_REDIS_PREFIX: "fyxvo:worker:test",
    WORKER_CONCURRENCY: "2",
    WORKER_REQUEST_LOG_BATCH_SIZE: "100",
    WORKER_SIGNATURE_BATCH_SIZE: "10",
    WORKER_NODE_TIMEOUT_MS: "1000",
    WORKER_REWARD_WINDOW_MINUTES: "60",
    WORKER_REWARD_LAMPORTS_PER_REQUEST: "250",
    ...overrides
  });
}

const noopLogger: WorkerLogger = {
  info() {},
  warn() {},
  error() {},
  debug() {}
};

class MemoryWorkerRepository implements WorkerRepository {
  readonly cursors = new Map<string, Record<string, unknown>>();
  readonly requestLogs: RequestLogRecord[] = [];
  readonly usageRollups: UsageRollupMutation[] = [];
  readonly walletTargets: WalletIndexTarget[] = [];
  readonly transactionLookups: ParsedTransactionRecord[] = [];
  readonly walletActivities: WalletActivityMutation[] = [];
  readonly walletBalances = new Map<string, readonly TokenBalanceSnapshot[]>();
  readonly nodes: ManagedNode[] = [];
  readonly nodeHealthChecks: NodeHealthCheckRecord[] = [];
  readonly operatorReputations = new Map<string, number>();
  readonly rewardInputs: Array<{
    operatorId: string;
    projectId: string;
    requestCount: number;
    uptimeRatio: number;
    reputationScore: number;
  }> = [];
  readonly rewardSnapshots: RewardSnapshotInput[] = [];

  async getCursor<TValue extends object>(key: string): Promise<TValue | null> {
    return (this.cursors.get(key) as TValue | undefined) ?? null;
  }

  async setCursor(key: string, value: Record<string, unknown>): Promise<void> {
    this.cursors.set(key, value);
  }

  async listRequestLogsSince(input: {
    readonly since: Date;
    readonly limit: number;
  }): Promise<RequestLogRecord[]> {
    return this.requestLogs
      .filter((log) => log.createdAt > input.since)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .slice(0, input.limit);
  }

  async mergeUsageRollup(input: UsageRollupMutation): Promise<void> {
    const existingIndex = this.usageRollups.findIndex(
      (rollup) =>
        rollup.projectId === input.projectId &&
        rollup.service === input.service &&
        rollup.windowStart.getTime() === input.windowStart.getTime() &&
        rollup.windowEnd.getTime() === input.windowEnd.getTime()
    );

    if (existingIndex >= 0) {
      const existing = this.usageRollups[existingIndex];
      this.usageRollups[existingIndex] = {
        ...existing,
        requestCount: existing.requestCount + input.requestCount,
        successCount: existing.successCount + input.successCount,
        errorCount: existing.errorCount + input.errorCount,
        totalDurationMs: existing.totalDurationMs + input.totalDurationMs,
        lastRequestAt:
          (existing.lastRequestAt?.getTime() ?? 0) > (input.lastRequestAt?.getTime() ?? 0)
            ? existing.lastRequestAt
            : input.lastRequestAt
      };
      return;
    }

    this.usageRollups.push(input);
  }

  async listWalletTargets(): Promise<WalletIndexTarget[]> {
    return this.walletTargets;
  }

  async upsertTransactionLookup(input: TransactionLookupRecord): Promise<void> {
    const existingIndex = this.transactionLookups.findIndex(
      (candidate) => candidate.signature === input.signature
    );
    if (existingIndex >= 0) {
      this.transactionLookups[existingIndex] = {
        ...this.transactionLookups[existingIndex],
        ...input,
        activityType: this.transactionLookups[existingIndex]?.activityType ?? "UNKNOWN"
      };
      return;
    }
    this.transactionLookups.push({
      ...input,
      activityType: "UNKNOWN"
    });
  }

  async upsertWalletActivity(input: WalletActivityMutation): Promise<void> {
    const existingIndex = this.walletActivities.findIndex(
      (candidate) =>
        candidate.walletAddress === input.walletAddress && candidate.signature === input.signature
    );
    if (existingIndex >= 0) {
      this.walletActivities[existingIndex] = input;
      return;
    }
    this.walletActivities.push(input);
  }

  async replaceWalletTokenBalances(input: {
    readonly walletAddress: string;
    readonly projectId: string | null;
    readonly balances: readonly TokenBalanceSnapshot[];
  }): Promise<void> {
    this.walletBalances.set(input.walletAddress, input.balances);
  }

  async listManagedNodes(): Promise<ManagedNode[]> {
    return this.nodes;
  }

  async recordNodeHealthCheck(input: NodeHealthCheckRecord): Promise<void> {
    this.nodeHealthChecks.push(input);
  }

  async updateNodeHealthState(input: {
    readonly nodeId: string;
    readonly status: NodeStatus;
    readonly reliabilityScore: number;
    readonly lastHeartbeatAt: Date | null;
  }): Promise<void> {
    const node = this.nodes.find((candidate) => candidate.id === input.nodeId);
    if (!node) {
      throw new Error(`Node ${input.nodeId} not found.`);
    }

    Object.assign(node, input);
  }

  async refreshOperatorReputation(operatorId: string): Promise<number> {
    const checks = this.nodeHealthChecks.filter((check) =>
      this.nodes.some((node) => node.id === check.nodeId && node.operatorId === operatorId)
    );
    const score = checks.length === 0 ? 0 : checks.filter((check) => check.isHealthy).length / checks.length;
    this.operatorReputations.set(operatorId, score);
    return score;
  }

  async listRewardInputs(): Promise<
    Array<{
      operatorId: string;
      projectId: string;
      requestCount: number;
      uptimeRatio: number;
      reputationScore: number;
    }>
  > {
    return this.rewardInputs;
  }

  async upsertRewardSnapshot(input: RewardSnapshotInput): Promise<void> {
    this.rewardSnapshots.push(input);
  }
}

class MemorySolanaIndexer implements SolanaIndexerClient {
  constructor(
    private readonly signatures: readonly SignatureSummary[],
    private readonly transactions: readonly ParsedTransactionRecord[],
    private readonly nativeBalance: NativeBalanceSnapshot,
    private readonly tokenBalances: readonly TokenBalanceSnapshot[]
  ) {}

  async getSignaturesForAddress(): Promise<readonly SignatureSummary[]> {
    return this.signatures;
  }

  async getParsedTransaction(signature: string): Promise<ParsedTransactionRecord | null> {
    return this.transactions.find((transaction) => transaction.signature === signature) ?? null;
  }

  async getNativeBalance(): Promise<NativeBalanceSnapshot> {
    return this.nativeBalance;
  }

  async getTokenBalances(): Promise<readonly TokenBalanceSnapshot[]> {
    return this.tokenBalances;
  }
}

const resources = new Set<{ close: () => Promise<unknown> }>();

afterEach(async () => {
  for (const resource of resources) {
    await resource.close();
    resources.delete(resource);
  }
});

async function startNodeServer(handler: (method: string) => { statusCode: number; body: unknown }) {
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => {
      chunks.push(chunk as Buffer);
    });
    request.on("end", () => {
      const body = chunks.length === 0 ? {} : (JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
        method?: string;
      });
      const result = handler(body.method ?? "unknown");
      response.statusCode = result.statusCode;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(result.body));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  resources.add({
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/`;
}

describe("Fyxvo worker processors", () => {
  it("aggregates request logs into usage rollups", async () => {
    const repository = new MemoryWorkerRepository();
    repository.requestLogs.push(
      {
        projectId: "project-1",
        service: "gateway",
        statusCode: 200,
        durationMs: 80,
        createdAt: new Date("2026-03-18T18:10:00.000Z")
      },
      {
        projectId: "project-1",
        service: "gateway",
        statusCode: 503,
        durationMs: 160,
        createdAt: new Date("2026-03-18T18:12:00.000Z")
      }
    );

    const result = await processMetricsAggregation({
      env: makeEnv(),
      repository,
      logger: noopLogger
    });

    expect(result.processed).toBe(2);
    expect(repository.usageRollups).toHaveLength(1);
    expect(repository.usageRollups[0]).toMatchObject({
      projectId: "project-1",
      service: "gateway",
      requestCount: 2,
      successCount: 1,
      errorCount: 1,
      totalDurationMs: 240
    });
    expect(repository.cursors.get("metrics-aggregation")).toEqual({
      lastProcessedAt: "2026-03-18T18:12:00.000Z"
    });
  });

  it("indexes wallet activity, transactions, and balances", async () => {
    const repository = new MemoryWorkerRepository();
    repository.walletTargets.push({
      walletAddress: "7bN4AqvpQAgx2j4r6rGfHc9GkgxJ5dThv7m6L7Q4J4r4",
      projectId: "project-1",
      source: "PROJECT_OWNER"
    });

    const indexer = new MemorySolanaIndexer(
      [
        {
          signature: "sig-new",
          slot: 301n,
          err: null,
          blockTime: new Date("2026-03-18T18:20:00.000Z")
        }
      ],
      [
        {
          signature: "sig-new",
          slot: 301n,
          blockTime: new Date("2026-03-18T18:20:00.000Z"),
          status: "CONFIRMED",
          activityType: "SOL_TRANSFER",
          raw: {
            amount: "1000"
          }
        }
      ],
      {
        mintAddress: "So11111111111111111111111111111111111111112",
        amount: "2500000000",
        decimals: 9
      },
      [
        {
          mintAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          amount: "1250000",
          decimals: 6
        }
      ]
    );

    const result = await processWalletIndexing({
      env: makeEnv(),
      repository,
      indexer,
      logger: noopLogger
    });

    expect(result.processed).toBe(1);
    expect(repository.transactionLookups).toHaveLength(1);
    expect(repository.walletActivities).toHaveLength(1);
    expect(repository.walletBalances.get("7bN4AqvpQAgx2j4r6rGfHc9GkgxJ5dThv7m6L7Q4J4r4")).toEqual([
      {
        mintAddress: "So11111111111111111111111111111111111111112",
        amount: "2500000000",
        decimals: 9
      },
      {
        mintAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        amount: "1250000",
        decimals: 6
      }
    ]);
    expect(
      repository.cursors.get(
        "wallet-indexing:7bN4AqvpQAgx2j4r6rGfHc9GkgxJ5dThv7m6L7Q4J4r4"
      )
    ).toEqual({
      lastSignature: "sig-new"
    });
  });

  it("probes nodes and updates health plus operator reputation", async () => {
    const healthyEndpoint = await startNodeServer((method) => {
      if (method === "getHealth") {
        return {
          statusCode: 200,
          body: {
            jsonrpc: "2.0",
            id: method,
            result: "ok"
          }
        };
      }

      return {
        statusCode: 200,
        body: {
          jsonrpc: "2.0",
          id: method,
          result: 123456
        }
      };
    });
    const unhealthyEndpoint = await startNodeServer((method) => ({
      statusCode: 200,
      body: {
        jsonrpc: "2.0",
        id: method,
        error: {
          code: -32005,
          message: "Node unhealthy"
        }
      }
    }));

    const repository = new MemoryWorkerRepository();
    repository.nodes.push(
      {
        id: "node-1",
        operatorId: "operator-1",
        projectId: "project-1",
        name: "healthy-node",
        endpoint: healthyEndpoint,
        region: "us-east-1",
        status: NodeStatus.ONLINE,
        reliabilityScore: 0.9,
        lastHeartbeatAt: null
      },
      {
        id: "node-2",
        operatorId: "operator-1",
        projectId: "project-1",
        name: "unhealthy-node",
        endpoint: unhealthyEndpoint,
        region: "us-west-2",
        status: NodeStatus.ONLINE,
        reliabilityScore: 0.8,
        lastHeartbeatAt: null
      }
    );

    const result = await processNodeHealthMonitoring({
      env: makeEnv(),
      repository,
      nodeProbe: new JsonRpcNodeProbeClient(),
      logger: noopLogger,
      now: new Date("2026-03-18T19:00:00.000Z")
    });

    expect(result.processed).toBe(2);
    expect(repository.nodeHealthChecks).toHaveLength(2);
    expect(repository.nodes[0]?.status).toBe(NodeStatus.ONLINE);
    expect(repository.nodes[1]?.status).toBe(NodeStatus.OFFLINE);
    expect(repository.operatorReputations.get("operator-1")).toBe(0.5);
  });

  it("computes operator reward snapshots from usage and uptime", async () => {
    const repository = new MemoryWorkerRepository();
    repository.rewardInputs.push({
      operatorId: "operator-1",
      projectId: "project-1",
      requestCount: 20,
      uptimeRatio: 0.95,
      reputationScore: 0.9
    });

    const result = await processRewardCalculation({
      env: makeEnv(),
      repository,
      logger: noopLogger,
      now: new Date("2026-03-18T19:15:00.000Z")
    });

    expect(result.processed).toBe(1);
    expect(repository.rewardSnapshots).toHaveLength(1);
    expect(repository.rewardSnapshots[0]).toMatchObject({
      operatorId: "operator-1",
      projectId: "project-1",
      requestCount: 20,
      uptimeRatio: 0.95,
      reputationScore: 0.9,
      rewardLamports: 4275n
    });
  });
});
