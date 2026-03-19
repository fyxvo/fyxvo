# Indexing System

## 1. Purpose

The worker service is the part of Fyxvo that turns raw operational data into durable analytics and operator intelligence.

It does four jobs:

1. Metrics aggregation
2. Wallet and token indexing
3. Node health monitoring
4. Reward snapshot calculation

The runtime is built in [`apps/worker/src/runtime.ts`](../apps/worker/src/runtime.ts) and the processors live in `apps/worker/src/jobs`.

## 2. Queue and Runtime Model

The worker is a BullMQ process backed by Redis.

1. It creates one queue named `<WORKER_NAME>:jobs`.
2. It enqueues one singleton job for each processor on startup.
3. It re-enqueues those singleton jobs every `WORKER_INTERVAL_MS`.
4. Concurrency is controlled by `WORKER_CONCURRENCY`.
5. Each completed or failed job produces a structured log event.

The queue is operationally independent from the API and gateway. If the worker is down, request serving continues, but analytics, indexing, health state, and reward snapshots go stale.

## 3. Metrics Aggregation

Metrics aggregation reads raw `RequestLog` rows and writes hourly `ProjectUsageRollup` rows.

1. The worker stores a cursor under the `metrics-aggregation` key in `WorkerCursor`.
2. It reads request logs strictly newer than the last processed timestamp.
3. It groups them by `projectId`, `service`, and hour window.
4. Each rollup stores request count, success count, error count, total duration, average latency, and the last request timestamp in the window.
5. If a rollup for that project, service, and window already exists, the worker merges the new counts into it.

This job is the source for analytics endpoints and reward request volume inputs.

## 4. Wallet and Token Indexing

Wallet indexing tracks project owner and node operator wallets.

1. Wallet targets are built from every project owner wallet and every node operator wallet.
2. Project owner wallets are tagged with `source = PROJECT_OWNER` and their project ID.
3. Operator wallets are tagged with `source = NODE_OPERATOR` and no project ID unless they are also project owners.
4. A per-wallet cursor stores the last processed signature.
5. The worker pulls recent signatures with `getSignaturesForAddress`.
6. It fetches parsed transactions for new signatures only.
7. It stores each transaction in `TransactionLookup`.
8. It stores each wallet activity row in `WalletActivity`.
9. It replaces the wallet’s token balance snapshot in `WalletTokenBalance`, including native SOL as the synthetic mint `So11111111111111111111111111111111111111112`.

The indexing job does not attempt deep Solana program-specific semantic decoding. It classifies obvious transfer activity and preserves the raw parsed transaction payload for later analysis.

## 5. Node Health Monitoring

Node health monitoring probes every managed node and updates both node state and operator reputation.

1. Each probe calls `getHealth`.
2. If the node is healthy, the worker also calls `getSlot`.
3. Probe output records health, latency, response slot, and error message.
4. The worker writes a `NodeHealthCheck` row for every observation.
5. The worker computes the next reliability score.
6. If a node fails, reliability is halved.
7. If a node succeeds, reliability becomes `current * 0.7 + latencyScore * 0.3`, where `latencyScore` is clamped between `0.2` and `1`.
8. A node becomes `OFFLINE` when the probe fails.
9. A node becomes `DEGRADED` when latency exceeds 60 percent of the timeout or reliability falls below `0.6`.
10. A node becomes `ONLINE` only when it is healthy and stays above those thresholds.
11. After all node probes finish, the worker recomputes operator reputation from recent node state.

Operator reputation is calculated as:

1. `reliabilityAverage = mean(node.reliabilityScore)`
2. `uptimeRatio = healthyChecks / totalChecks`, or `reliabilityAverage` if there are no checks
3. `reputationScore = clamp(reliabilityAverage * 0.6 + uptimeRatio * 0.4, 0, 1)`

That score feeds directly into reward snapshots.

## 6. Reward Snapshot Calculation

Reward calculation is off chain and windowed.

1. The worker chooses a reward window based on `WORKER_REWARD_WINDOW_MINUTES`.
2. It loads project usage rollups fully contained in that window.
3. It sums request counts by project.
4. It loads nodes for those projects, along with node operator data and health checks inside the same window.
5. For each node, it derives a weight of `max(0.1, reliabilityScore)`.
6. For each operator inside a project, it sums node weights and averages node uptime ratios.
7. It allocates project request count proportionally by operator weight.
8. It computes `rewardLamports = round(requestCount * WORKER_REWARD_LAMPORTS_PER_REQUEST * uptimeRatio * reputationScore)`.
9. It stores the result in `OperatorRewardSnapshot`.

This job does not send an on-chain transaction. It gives operators and project owners an auditable reward proposal that can later be turned into `accrue_reward` calls on the Anchor program.

## 7. Operational Limits

The indexing system is intentionally straightforward today.

1. It pages signatures with a fixed batch size.
2. It does not yet parallelize wallet indexing inside a single job tick.
3. Reward snapshots are informational and not automatically bridged on chain.
4. There is no cold-storage archive path for raw transaction payloads yet.

Those are reasonable tradeoffs for the current devnet-focused system, but they should stay visible when planning mainnet scale.
