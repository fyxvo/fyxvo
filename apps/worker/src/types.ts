import type { WorkerEnv } from "@fyxvo/config";
import type { Node, PrismaClientType } from "@fyxvo/database";

export const workerJobNames = {
  metricsAggregation: "metrics-aggregation",
  walletIndexing: "wallet-indexing",
  nodeHealthMonitoring: "node-health-monitoring",
  rewardCalculation: "reward-calculation",
  serviceHealthCheck: "service-health-check"
} as const;

export type WorkerJobName = (typeof workerJobNames)[keyof typeof workerJobNames];

export interface WorkerLogger {
  info(context: Record<string, unknown>, message: string): void;
  warn(context: Record<string, unknown>, message: string): void;
  error(context: Record<string, unknown>, message: string): void;
  debug(context: Record<string, unknown>, message: string): void;
}

export interface RequestLogRecord {
  readonly projectId: string | null;
  readonly service: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly createdAt: Date;
}

export interface UsageRollupMutation {
  readonly projectId: string | null;
  readonly service: string;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly requestCount: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly totalDurationMs: number;
  readonly lastRequestAt: Date | null;
}

export interface WalletIndexTarget {
  readonly walletAddress: string;
  readonly projectId: string | null;
  readonly source: "PROJECT_OWNER" | "NODE_OPERATOR";
}

export interface TransactionLookupRecord {
  readonly signature: string;
  readonly slot: bigint;
  readonly status: string;
  readonly blockTime: Date | null;
  readonly raw: Record<string, unknown>;
}

export interface WalletActivityMutation {
  readonly walletAddress: string;
  readonly signature: string;
  readonly activityType: string;
  readonly slot: bigint;
  readonly blockTime: Date | null;
  readonly success: boolean;
  readonly projectId: string | null;
  readonly source: string;
  readonly raw: Record<string, unknown>;
}

export interface TokenBalanceSnapshot {
  readonly mintAddress: string;
  readonly amount: string;
  readonly decimals: number;
}

export interface ManagedNode {
  readonly id: string;
  readonly operatorId: string;
  readonly projectId: string | null;
  readonly name: string;
  readonly endpoint: string;
  readonly region: string;
  readonly status: Node["status"];
  readonly reliabilityScore: number;
  readonly lastHeartbeatAt: Date | null;
}

export interface NodeHealthObservation {
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly responseSlot: bigint | null;
  readonly errorMessage: string | null;
}

export interface NodeHealthCheckRecord extends NodeHealthObservation {
  readonly nodeId: string;
  readonly checkedAt: Date;
}

export interface NodeHealthStateUpdate {
  readonly nodeId: string;
  readonly status: Node["status"];
  readonly reliabilityScore: number;
  readonly lastHeartbeatAt: Date | null;
}

export interface RewardComputationInput {
  readonly operatorId: string;
  readonly projectId: string;
  readonly requestCount: number;
  readonly uptimeRatio: number;
  readonly reputationScore: number;
}

export interface RewardSnapshotInput extends RewardComputationInput {
  readonly rewardLamports: bigint;
  readonly windowStart: Date;
  readonly windowEnd: Date;
}

export interface WorkerRepository {
  readonly prisma?: PrismaClientType;
  getCursor<TValue extends object>(key: string): Promise<TValue | null>;
  setCursor(key: string, value: Record<string, unknown>): Promise<void>;
  listRequestLogsSince(input: {
    readonly since: Date;
    readonly limit: number;
  }): Promise<RequestLogRecord[]>;
  mergeUsageRollup(input: UsageRollupMutation): Promise<void>;
  listWalletTargets(): Promise<WalletIndexTarget[]>;
  upsertTransactionLookup(input: TransactionLookupRecord): Promise<void>;
  upsertWalletActivity(input: WalletActivityMutation): Promise<void>;
  replaceWalletTokenBalances(input: {
    readonly walletAddress: string;
    readonly projectId: string | null;
    readonly balances: readonly TokenBalanceSnapshot[];
  }): Promise<void>;
  listManagedNodes(): Promise<ManagedNode[]>;
  recordNodeHealthCheck(input: NodeHealthCheckRecord): Promise<void>;
  updateNodeHealthState(input: NodeHealthStateUpdate): Promise<void>;
  refreshOperatorReputation(operatorId: string): Promise<number>;
  listRewardInputs(input: {
    readonly windowStart: Date;
    readonly windowEnd: Date;
  }): Promise<RewardComputationInput[]>;
  upsertRewardSnapshot(input: RewardSnapshotInput): Promise<void>;
  writeServiceHealthSnapshot(input: {
    readonly serviceName: string;
    readonly status: string;
    readonly responseTimeMs?: number | null;
    readonly errorMessage?: string | null;
  }): Promise<void>;
  countRecentUnhealthySnapshots(serviceName: string, windowMinutes: number): Promise<number>;
  openIncident(input: {
    readonly serviceName: string;
    readonly severity: string;
    readonly description: string;
  }): Promise<string>;
  resolveIncident(incidentId: string): Promise<void>;
  findOpenIncident(serviceName: string): Promise<{ id: string } | null>;
}

export interface SignatureSummary {
  readonly signature: string;
  readonly slot: bigint;
  readonly err: unknown;
  readonly blockTime: Date | null;
}

export interface ParsedTransactionRecord {
  readonly signature: string;
  readonly slot: bigint;
  readonly blockTime: Date | null;
  readonly status: string;
  readonly activityType: string;
  readonly raw: Record<string, unknown>;
}

export type NativeBalanceSnapshot = TokenBalanceSnapshot;

export interface SolanaIndexerClient {
  getSignaturesForAddress(
    walletAddress: string,
    limit: number
  ): Promise<readonly SignatureSummary[]>;
  getParsedTransaction(signature: string): Promise<ParsedTransactionRecord | null>;
  getNativeBalance(walletAddress: string): Promise<NativeBalanceSnapshot>;
  getTokenBalances(walletAddress: string): Promise<readonly TokenBalanceSnapshot[]>;
}

export interface NodeProbeClient {
  probe(endpoint: string, timeoutMs: number): Promise<NodeHealthObservation>;
}

export interface WorkerProcessorDependencies {
  readonly env: WorkerEnv;
  readonly repository: WorkerRepository;
  readonly logger: WorkerLogger;
  readonly indexer: SolanaIndexerClient;
  readonly nodeProbe: NodeProbeClient;
}

export interface WorkerRuntime {
  start(): Promise<void>;
  close(): Promise<void>;
}

export interface WorkerJobResult {
  readonly job: WorkerJobName;
  readonly processed: number;
  readonly details: Record<string, unknown>;
}
