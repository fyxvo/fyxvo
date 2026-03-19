import { NodeStatus } from "@fyxvo/database";
import type { WorkerEnv } from "@fyxvo/config";
import { deriveNodeStatus } from "../repository.js";
import type { ManagedNode, NodeHealthObservation, NodeProbeClient, WorkerJobResult, WorkerLogger, WorkerRepository } from "../types.js";
import { workerJobNames } from "../types.js";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function nextReliabilityScore(input: {
  readonly current: number;
  readonly timeoutMs: number;
  readonly observation: NodeHealthObservation;
}): number {
  if (!input.observation.isHealthy) {
    return clamp(input.current * 0.5, 0, 1);
  }

  const latencyScore = clamp(1 - input.observation.latencyMs / input.timeoutMs, 0.2, 1);
  return clamp(input.current * 0.7 + latencyScore * 0.3, 0, 1);
}

async function monitorNode(input: {
  readonly env: WorkerEnv;
  readonly node: ManagedNode;
  readonly repository: WorkerRepository;
  readonly nodeProbe: NodeProbeClient;
  readonly logger: WorkerLogger;
  readonly now: Date;
}) {
  const observation = await input.nodeProbe.probe(input.node.endpoint, input.env.WORKER_NODE_TIMEOUT_MS);
  const reliabilityScore = nextReliabilityScore({
    current: input.node.reliabilityScore,
    timeoutMs: input.env.WORKER_NODE_TIMEOUT_MS,
    observation
  });
  const status = deriveNodeStatus({
    timeoutMs: input.env.WORKER_NODE_TIMEOUT_MS,
    isHealthy: observation.isHealthy,
    latencyMs: observation.latencyMs,
    reliabilityScore
  });

  await input.repository.recordNodeHealthCheck({
    nodeId: input.node.id,
    checkedAt: input.now,
    ...observation
  });

  await input.repository.updateNodeHealthState({
    nodeId: input.node.id,
    status,
    reliabilityScore,
    lastHeartbeatAt: observation.isHealthy ? input.now : input.node.lastHeartbeatAt
  });

  input.logger.debug(
    {
      nodeId: input.node.id,
      endpoint: input.node.endpoint,
      status,
      latencyMs: observation.latencyMs,
      responseSlot: observation.responseSlot?.toString() ?? null
    },
    "Node health probe completed"
  );

  return {
    operatorId: input.node.operatorId,
    status
  };
}

export async function processNodeHealthMonitoring(input: {
  readonly env: WorkerEnv;
  readonly repository: WorkerRepository;
  readonly nodeProbe: NodeProbeClient;
  readonly logger: WorkerLogger;
  readonly now?: Date;
}): Promise<WorkerJobResult> {
  const now = input.now ?? new Date();
  const nodes = await input.repository.listManagedNodes();
  const operatorIds = new Set<string>();
  let healthyNodes = 0;
  let degradedNodes = 0;
  let offlineNodes = 0;

  for (const node of nodes) {
    const result = await monitorNode({
      env: input.env,
      node,
      repository: input.repository,
      nodeProbe: input.nodeProbe,
      logger: input.logger,
      now
    });
    operatorIds.add(result.operatorId);

    if (result.status === NodeStatus.ONLINE) {
      healthyNodes += 1;
    } else if (result.status === NodeStatus.DEGRADED) {
      degradedNodes += 1;
    } else if (result.status === NodeStatus.OFFLINE) {
      offlineNodes += 1;
    }
  }

  const reputationUpdates: Record<string, number> = {};
  for (const operatorId of operatorIds) {
    reputationUpdates[operatorId] = await input.repository.refreshOperatorReputation(operatorId);
  }

  input.logger.info(
    {
      nodeCount: nodes.length,
      healthyNodes,
      degradedNodes,
      offlineNodes,
      operatorCount: operatorIds.size
    },
    "Node health monitoring completed"
  );

  return {
    job: workerJobNames.nodeHealthMonitoring,
    processed: nodes.length,
    details: {
      healthyNodes,
      degradedNodes,
      offlineNodes,
      reputationUpdates
    }
  };
}
