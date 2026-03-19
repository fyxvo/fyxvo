# Gateway Architecture

## 1. Purpose

The gateway is the critical runtime in Fyxvo. It is the component that turns funded project state into actual Solana RPC access.

Its job is not to manage users or prepare transactions. Its job is to decide, for every JSON RPC request, whether that request is allowed, how much it costs, which upstream node should serve it, and how the result should be logged.

The implementation lives in [`apps/gateway/src/app.ts`](../apps/gateway/src/app.ts).

## 2. Entry Points

The gateway exposes seven paths:

1. `POST /`
2. `POST /rpc`
3. `POST /priority`
4. `POST /priority-rpc`
5. `GET /health`
6. `GET /v1/status`
7. `GET /v1/metrics`

The two standard endpoints and the two priority endpoints execute the same core handler with different pricing, timeouts, and rate limits.

## 3. Authentication and Project Resolution

Authentication is API-key based.

1. The gateway reads the caller key from `x-api-key` first.
2. If that header is missing, it falls back to `Authorization: Bearer <key>`.
3. The key is SHA-256 hashed and matched against `ApiKey.keyHash` in PostgreSQL.
4. The key must be `ACTIVE`.
5. The key must not be expired.
6. The matched key resolves a single project and that project’s owner wallet and on-chain PDA.
7. Standard relay requests now require `rpc:request`.
8. Priority relay requests now require both `rpc:request` and `priority:relay`.
9. Missing scope membership is rejected with `403 insufficient_api_key_scope` and a machine-readable required versus granted scope payload.

## 4. Request Pricing

Pricing is deterministic and happens before upstream routing.

1. Standard mode starts from `GATEWAY_STANDARD_PRICE_LAMPORTS`.
2. Priority mode starts from `GATEWAY_PRIORITY_PRICE_LAMPORTS`.
3. Each JSON RPC method in the payload is priced independently.
4. Methods `sendTransaction`, `sendRawTransaction`, `simulateTransaction`, and `requestAirdrop` receive the configured write multiplier.
5. The total request price is the sum of all per-method charges in the batch.

This logic lives in [`apps/gateway/src/pricing.ts`](../apps/gateway/src/pricing.ts).

## 5. Balance Enforcement

The gateway charges requests against project balances without writing every request on chain.

1. It reads the project’s current on-chain balance by decoding the Anchor `ProjectAccount`.
2. It extracts `available_sol_balance` and `available_usdc_balance` from fixed offsets in the account data.
3. It reads the project’s already-spent credits from Redis.
4. It chooses SOL first if available SOL minus spend is at least `requiredCredits + minimumReserve`.
5. It tries USDC only when the protocol readiness check says the configured devnet USDC asset path is valid and runtime config has enabled USDC.
6. If neither asset can satisfy the request, the gateway rejects the request with `402 insufficient_project_funds`.

This is the key hybrid decision path. Redis gives the gateway fast metering, and the on-chain project account prevents a stateless relay from spending imaginary credits.

## 6. Upstream Routing and Fallback

The gateway supports multiple upstream nodes and has different ordering behavior for standard and priority traffic.

1. Upstream nodes are loaded from the `Node` table for the active network and filtered to `ONLINE` or `DEGRADED`.
2. For project-specific traffic, the repository includes both project-bound nodes and shared fallback nodes.
3. Standard mode prefers online project nodes first, then online shared nodes, then degraded project nodes, then degraded shared nodes.
4. Priority mode prefers any project-specific online node first, then shared online nodes, then project-specific degraded nodes, then shared degraded nodes.
5. Nodes are sorted again by most recent heartbeat.
6. The router rotates the starting index between requests so traffic is not pinned to a single node.
7. Failed nodes enter a cooldown map for `GATEWAY_NODE_FAILURE_COOLDOWN_MS`.
8. Each attempt uses `AbortSignal.timeout` with the mode-specific timeout.
9. If a node returns an HTTP status of `500` or higher, the router treats that attempt as a failure and tries the next candidate.
10. If every candidate fails, the gateway returns `503 upstream_unavailable`.

This behavior is implemented in [`apps/gateway/src/router.ts`](../apps/gateway/src/router.ts).

## 7. Rate Limiting and Runtime State

Redis is the runtime state store for rate limiting, spend tracking, and live metrics.

1. Rate limit buckets are keyed by mode, subject, and time bucket.
2. The subject is the API key ID, not the project ID.
3. Standard and priority traffic have separate limits and windows.
4. Spend is tracked per project and per asset.
5. Metrics are aggregated separately for standard and priority traffic.
6. The status surface includes protocol readiness details so operators can tell the difference between an upstream issue and an undeployed or misconfigured devnet program.
7. The health endpoint requires PostgreSQL, Redis, and at least one reachable upstream node to report `ok`.

This behavior is implemented in [`apps/gateway/src/state.ts`](../apps/gateway/src/state.ts).

## 8. Observability and Response Headers

Every completed gateway request writes structured logs and a durable request log row.

The gateway also emits relay-specific headers:

1. `x-ratelimit-limit`
2. `x-ratelimit-remaining`
3. `x-ratelimit-reset`
4. `x-fyxvo-project-id`
5. `x-fyxvo-project-slug`
6. `x-fyxvo-upstream-node-id`
7. `x-fyxvo-routing-mode`
8. `x-fyxvo-price-credits`
9. `x-fyxvo-billed-asset`

That header set is important operationally because it lets clients correlate billing, routing, and rate limiting without reaching into backend logs.

## 9. Failure Semantics

The gateway has deliberate status code boundaries.

1. `401` means the API key is missing or invalid.
2. `402` means the project does not have enough funded balance.
3. `403` means the API key exists but is missing the required relay scopes for that route.
4. `429` means the Redis-backed rate limit rejected the request.
5. `503` means there are no upstream nodes or all upstream nodes failed.
6. `500` is reserved for unexpected internal failures.

That separation matters because only some failures should trigger retries. `429` and `402` are billing or policy outcomes. `503` is an infrastructure outcome.
