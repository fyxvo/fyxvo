import type { WorkerEnv } from "@fyxvo/config";
import type { RequestLogRecord, UsageRollupMutation, WorkerJobResult, WorkerLogger, WorkerRepository } from "../types.js";
import { workerJobNames } from "../types.js";

interface MetricsCursor {
  readonly lastProcessedAt: string;
}

function hourWindow(date: Date) {
  const windowStart = new Date(date);
  windowStart.setUTCMinutes(0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setUTCHours(windowEnd.getUTCHours() + 1);
  return { windowStart, windowEnd };
}

function groupRequestLogs(logs: readonly RequestLogRecord[]): UsageRollupMutation[] {
  const groups = new Map<string, UsageRollupMutation>();

  for (const log of logs) {
    const { windowStart, windowEnd } = hourWindow(log.createdAt);
    const key = `${log.projectId ?? "global"}:${log.service}:${windowStart.toISOString()}`;
    const existing = groups.get(key);

    if (existing) {
      groups.set(key, {
        ...existing,
        requestCount: existing.requestCount + 1,
        successCount: existing.successCount + (log.statusCode < 400 ? 1 : 0),
        errorCount: existing.errorCount + (log.statusCode >= 400 ? 1 : 0),
        totalDurationMs: existing.totalDurationMs + log.durationMs,
        lastRequestAt:
          (existing.lastRequestAt?.getTime() ?? 0) > log.createdAt.getTime()
            ? existing.lastRequestAt
            : log.createdAt
      });
      continue;
    }

    groups.set(key, {
      projectId: log.projectId,
      service: log.service,
      windowStart,
      windowEnd,
      requestCount: 1,
      successCount: log.statusCode < 400 ? 1 : 0,
      errorCount: log.statusCode >= 400 ? 1 : 0,
      totalDurationMs: log.durationMs,
      lastRequestAt: log.createdAt
    });
  }

  return [...groups.values()];
}

export async function processMetricsAggregation(input: {
  readonly env: WorkerEnv;
  readonly repository: WorkerRepository;
  readonly logger: WorkerLogger;
  readonly now?: Date;
}): Promise<WorkerJobResult> {
  const cursor =
    (await input.repository.getCursor<MetricsCursor>(workerJobNames.metricsAggregation)) ??
    null;
  const since = cursor ? new Date(cursor.lastProcessedAt) : new Date(0);
  const logs = await input.repository.listRequestLogsSince({
    since,
    limit: input.env.WORKER_REQUEST_LOG_BATCH_SIZE
  });

  if (logs.length === 0) {
    input.logger.debug(
      {
        cursor: cursor?.lastProcessedAt ?? null
      },
      "Metrics aggregation found no new request logs"
    );

    return {
      job: workerJobNames.metricsAggregation,
      processed: 0,
      details: {
        rollupsUpserted: 0
      }
    };
  }

  const rollups = groupRequestLogs(logs);
  for (const rollup of rollups) {
    await input.repository.mergeUsageRollup(rollup);
  }

  const lastProcessedAt = logs[logs.length - 1]?.createdAt ?? input.now ?? new Date();
  await input.repository.setCursor(workerJobNames.metricsAggregation, {
    lastProcessedAt: lastProcessedAt.toISOString()
  });

  input.logger.info(
    {
      requestCount: logs.length,
      rollupCount: rollups.length,
      lastProcessedAt: lastProcessedAt.toISOString()
    },
    "Metrics aggregation completed"
  );

  return {
    job: workerJobNames.metricsAggregation,
    processed: logs.length,
    details: {
      rollupsUpserted: rollups.length,
      lastProcessedAt: lastProcessedAt.toISOString()
    }
  };
}
