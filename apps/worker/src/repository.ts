import { NodeStatus, type PrismaClientType, type Node, type PrismaNamespace } from "@fyxvo/database";
import type {
  ManagedNode,
  NodeHealthCheckRecord,
  NodeHealthStateUpdate,
  RequestLogRecord,
  RewardComputationInput,
  RewardSnapshotInput,
  TokenBalanceSnapshot,
  TransactionLookupRecord,
  UsageRollupMutation,
  WalletActivityMutation,
  WalletIndexTarget,
  WorkerRepository
} from "./types.js";

function toJsonValue(value: Record<string, unknown>): PrismaNamespace.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, candidate) =>
      typeof candidate === "bigint" ? candidate.toString() : candidate
    )
  ) as PrismaNamespace.InputJsonValue;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export class PrismaWorkerRepository implements WorkerRepository {
  constructor(readonly prisma: PrismaClientType) {}

  async getCursor<TValue extends object>(key: string): Promise<TValue | null> {
    const record = await this.prisma.workerCursor.findUnique({
      where: { key }
    });

    return record ? (record.cursorValue as TValue) : null;
  }

  async setCursor(key: string, value: Record<string, unknown>): Promise<void> {
    await this.prisma.workerCursor.upsert({
      where: { key },
      update: {
        cursorValue: toJsonValue(value)
      },
      create: {
        key,
        cursorValue: toJsonValue(value)
      }
    });
  }

  async listRequestLogsSince(input: {
    readonly since: Date;
    readonly limit: number;
  }): Promise<RequestLogRecord[]> {
    return this.prisma.requestLog.findMany({
      where: {
        createdAt: {
          gt: input.since
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      take: input.limit,
      select: {
        projectId: true,
        service: true,
        statusCode: true,
        durationMs: true,
        createdAt: true
      }
    });
  }

  async mergeUsageRollup(input: UsageRollupMutation): Promise<void> {
    await this.prisma.$transaction(async (tx: PrismaNamespace.TransactionClient) => {
      const existing = await tx.projectUsageRollup.findFirst({
        where: {
          projectId: input.projectId,
          service: input.service,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd
        }
      });

      const requestCount = (existing?.requestCount ?? 0) + input.requestCount;
      const successCount = (existing?.successCount ?? 0) + input.successCount;
      const errorCount = (existing?.errorCount ?? 0) + input.errorCount;
      const totalDurationMs = (existing?.totalDurationMs ?? 0) + input.totalDurationMs;
      const averageLatencyMs = requestCount === 0 ? 0 : Math.round(totalDurationMs / requestCount);
      const existingLastRequestAt = existing?.lastRequestAt?.getTime() ?? 0;
      const incomingLastRequestAt = input.lastRequestAt?.getTime() ?? 0;
      const lastRequestAt =
        Math.max(existingLastRequestAt, incomingLastRequestAt) === 0
          ? null
          : new Date(Math.max(existingLastRequestAt, incomingLastRequestAt));

      if (existing) {
        await tx.projectUsageRollup.update({
          where: {
            id: existing.id
          },
          data: {
            requestCount,
            successCount,
            errorCount,
            totalDurationMs,
            averageLatencyMs,
            lastRequestAt
          }
        });
        return;
      }

      await tx.projectUsageRollup.create({
        data: {
          projectId: input.projectId,
          service: input.service,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd,
          requestCount,
          successCount,
          errorCount,
          totalDurationMs,
          averageLatencyMs,
          lastRequestAt
        }
      });
    });
  }

  async listWalletTargets(): Promise<WalletIndexTarget[]> {
    const [projects, operators] = await Promise.all([
      this.prisma.project.findMany({
        include: {
          owner: true
        }
      }),
      this.prisma.nodeOperator.findMany()
    ]);

    const targets = new Map<string, WalletIndexTarget>();

    for (const project of projects) {
      const existing = targets.get(project.owner.walletAddress);
      if (!existing || existing.projectId === null) {
        targets.set(project.owner.walletAddress, {
          walletAddress: project.owner.walletAddress,
          projectId: project.id,
          source: "PROJECT_OWNER"
        });
      }
    }

    for (const operator of operators) {
      if (!targets.has(operator.walletAddress)) {
        targets.set(operator.walletAddress, {
          walletAddress: operator.walletAddress,
          projectId: null,
          source: "NODE_OPERATOR"
        });
      }
    }

    return [...targets.values()];
  }

  async upsertTransactionLookup(input: TransactionLookupRecord): Promise<void> {
    await this.prisma.transactionLookup.upsert({
      where: {
        signature: input.signature
      },
      update: {
        slot: input.slot,
        status: input.status,
        blockTime: input.blockTime,
        raw: toJsonValue(input.raw)
      },
      create: {
        signature: input.signature,
        slot: input.slot,
        status: input.status,
        blockTime: input.blockTime,
        raw: toJsonValue(input.raw)
      }
    });
  }

  async upsertWalletActivity(input: WalletActivityMutation): Promise<void> {
    await this.prisma.walletActivity.upsert({
      where: {
        walletAddress_signature: {
          walletAddress: input.walletAddress,
          signature: input.signature
        }
      },
      update: {
        activityType: input.activityType,
        slot: input.slot,
        blockTime: input.blockTime,
        success: input.success,
        projectId: input.projectId,
        source: input.source,
        raw: toJsonValue(input.raw)
      },
      create: {
        walletAddress: input.walletAddress,
        signature: input.signature,
        activityType: input.activityType,
        slot: input.slot,
        blockTime: input.blockTime,
        success: input.success,
        projectId: input.projectId,
        source: input.source,
        raw: toJsonValue(input.raw)
      }
    });
  }

  async replaceWalletTokenBalances(input: {
    readonly walletAddress: string;
    readonly projectId: string | null;
    readonly balances: readonly TokenBalanceSnapshot[];
  }): Promise<void> {
    await this.prisma.$transaction(async (tx: PrismaNamespace.TransactionClient) => {
      const mintAddresses = input.balances.map((balance) => balance.mintAddress);

      if (mintAddresses.length === 0) {
        await tx.walletTokenBalance.deleteMany({
          where: {
            walletAddress: input.walletAddress
          }
        });
        return;
      }

      for (const balance of input.balances) {
        await tx.walletTokenBalance.upsert({
          where: {
            walletAddress_mintAddress: {
              walletAddress: input.walletAddress,
              mintAddress: balance.mintAddress
            }
          },
          update: {
            projectId: input.projectId,
            amount: balance.amount,
            decimals: balance.decimals
          },
          create: {
            walletAddress: input.walletAddress,
            mintAddress: balance.mintAddress,
            projectId: input.projectId,
            amount: balance.amount,
            decimals: balance.decimals
          }
        });
      }

      await tx.walletTokenBalance.deleteMany({
        where: {
          walletAddress: input.walletAddress,
          mintAddress: {
            notIn: mintAddresses
          }
        }
      });
    });
  }

  async listManagedNodes(): Promise<ManagedNode[]> {
    return this.prisma.node.findMany({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        operatorId: true,
        projectId: true,
        name: true,
        endpoint: true,
        region: true,
        status: true,
        reliabilityScore: true,
        lastHeartbeatAt: true
      }
    });
  }

  async recordNodeHealthCheck(input: NodeHealthCheckRecord): Promise<void> {
    await this.prisma.nodeHealthCheck.create({
      data: {
        nodeId: input.nodeId,
        isHealthy: input.isHealthy,
        latencyMs: input.latencyMs,
        responseSlot: input.responseSlot,
        errorMessage: input.errorMessage,
        checkedAt: input.checkedAt
      }
    });
  }

  async updateNodeHealthState(input: NodeHealthStateUpdate): Promise<void> {
    await this.prisma.node.update({
      where: {
        id: input.nodeId
      },
      data: {
        status: input.status,
        reliabilityScore: input.reliabilityScore,
        lastHeartbeatAt: input.lastHeartbeatAt
      }
    });
  }

  async refreshOperatorReputation(operatorId: string): Promise<number> {
    const nodes = await this.prisma.node.findMany({
      where: {
        operatorId
      },
      include: {
        healthChecks: {
          orderBy: {
            checkedAt: "desc"
          },
          take: 24
        }
      }
    });

    const reliabilityAverage =
      nodes.length === 0
        ? 0
        : nodes.reduce((total, node) => total + node.reliabilityScore, 0) / nodes.length;
    const healthChecks = nodes.flatMap((node) => node.healthChecks);
    const uptimeRatio =
      healthChecks.length === 0
        ? reliabilityAverage
        : healthChecks.filter((check) => check.isHealthy).length / healthChecks.length;
    const reputationScore = clamp(reliabilityAverage * 0.6 + uptimeRatio * 0.4, 0, 1);

    await this.prisma.nodeOperator.update({
      where: {
        id: operatorId
      },
      data: {
        reputationScore
      }
    });

    return reputationScore;
  }

  async listRewardInputs(input: {
    readonly windowStart: Date;
    readonly windowEnd: Date;
  }): Promise<RewardComputationInput[]> {
    const rollups = await this.prisma.projectUsageRollup.findMany({
      where: {
        projectId: {
          not: null
        },
        windowStart: {
          gte: input.windowStart
        },
        windowEnd: {
          lte: input.windowEnd
        }
      }
    });

    const requestCountByProject = new Map<string, number>();
    for (const rollup of rollups) {
      if (!rollup.projectId) {
        continue;
      }
      requestCountByProject.set(
        rollup.projectId,
        (requestCountByProject.get(rollup.projectId) ?? 0) + rollup.requestCount
      );
    }

    if (requestCountByProject.size === 0) {
      return [];
    }

    const nodes = await this.prisma.node.findMany({
      where: {
        projectId: {
          in: [...requestCountByProject.keys()]
        }
      },
      include: {
        operator: true,
        healthChecks: {
          where: {
            checkedAt: {
              gte: input.windowStart,
              lt: input.windowEnd
            }
          }
        }
      }
    });

    const byProject = new Map<
      string,
      Array<{
        readonly operatorId: string;
        readonly reputationScore: number;
        readonly weight: number;
        readonly uptimeRatio: number;
      }>
    >();

    for (const node of nodes) {
      if (!node.projectId) {
        continue;
      }

      const current = byProject.get(node.projectId) ?? [];
      const healthyChecks = node.healthChecks.filter((check) => check.isHealthy).length;
      const uptimeRatio =
        node.healthChecks.length === 0 ? node.reliabilityScore : healthyChecks / node.healthChecks.length;
      const weight = Math.max(0.1, node.reliabilityScore);

      current.push({
        operatorId: node.operatorId,
        reputationScore: node.operator.reputationScore,
        weight,
        uptimeRatio
      });
      byProject.set(node.projectId, current);
    }

    const inputs: RewardComputationInput[] = [];
    for (const [projectId, totalRequests] of requestCountByProject.entries()) {
      const entries = byProject.get(projectId) ?? [];
      if (entries.length === 0) {
        continue;
      }

      const grouped = new Map<
        string,
        {
          weight: number;
          uptimeScore: number;
          uptimeCount: number;
          reputationScore: number;
        }
      >();

      for (const entry of entries) {
        const current = grouped.get(entry.operatorId) ?? {
          weight: 0,
          uptimeScore: 0,
          uptimeCount: 0,
          reputationScore: entry.reputationScore
        };
        current.weight += entry.weight;
        current.uptimeScore += entry.uptimeRatio;
        current.uptimeCount += 1;
        current.reputationScore = entry.reputationScore;
        grouped.set(entry.operatorId, current);
      }

      const totalWeight = [...grouped.values()].reduce((sum, entry) => sum + entry.weight, 0);
      if (totalWeight === 0) {
        continue;
      }

      for (const [operatorId, entry] of grouped.entries()) {
        inputs.push({
          operatorId,
          projectId,
          requestCount: Math.max(1, Math.round(totalRequests * (entry.weight / totalWeight))),
          uptimeRatio: clamp(entry.uptimeScore / entry.uptimeCount, 0, 1),
          reputationScore: clamp(entry.reputationScore, 0, 1)
        });
      }
    }

    return inputs;
  }

  async upsertRewardSnapshot(input: RewardSnapshotInput): Promise<void> {
    await this.prisma.operatorRewardSnapshot.upsert({
      where: {
        operatorId_projectId_windowStart_windowEnd: {
          operatorId: input.operatorId,
          projectId: input.projectId,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd
        }
      },
      update: {
        requestCount: input.requestCount,
        uptimeRatio: input.uptimeRatio,
        reputationScore: input.reputationScore,
        rewardLamports: input.rewardLamports
      },
      create: {
        operatorId: input.operatorId,
        projectId: input.projectId,
        requestCount: input.requestCount,
        uptimeRatio: input.uptimeRatio,
        reputationScore: input.reputationScore,
        rewardLamports: input.rewardLamports,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd
      }
    });
  }
  async writeServiceHealthSnapshot(input: {
    readonly serviceName: string;
    readonly status: string;
    readonly responseTimeMs?: number | null;
    readonly errorMessage?: string | null;
  }): Promise<void> {
    await this.prisma.serviceHealthSnapshot.create({
      data: {
        serviceName: input.serviceName,
        status: input.status,
        responseTimeMs: input.responseTimeMs ?? null,
        errorMessage: input.errorMessage ?? null
      }
    });
  }
}

export function deriveNodeStatus(input: {
  readonly timeoutMs: number;
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly reliabilityScore: number;
}): Node["status"] {
  if (!input.isHealthy) {
    return NodeStatus.OFFLINE;
  }

  if (
    input.latencyMs > Math.round(input.timeoutMs * 0.6) ||
    input.reliabilityScore < 0.6
  ) {
    return NodeStatus.DEGRADED;
  }

  return NodeStatus.ONLINE;
}
