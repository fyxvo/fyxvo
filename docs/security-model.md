# Security Model

## 1. Security Boundaries

Fyxvo has four separate trust domains:

1. The browser wallet domain, where Phantom owns the private key and signature flow.
2. The API domain, where wallet ownership is verified and JWT sessions are minted.
3. The gateway domain, where API keys, rate limits, and funded access are enforced.
4. The on-chain domain, where treasury balances, project balances, operator registrations, and reward claims are authoritative.

The system is safer because these domains do not collapse into one service. The API never stores a private key. The frontend never gets a database credential. The gateway never mints sessions. The Anchor program never depends on off-chain trust for balance math.

## 2. Wallet Authentication

Wallet authentication is challenge based and nonce bound.

1. The client asks for `/v1/auth/challenge`.
2. The API creates or refreshes the user nonce and returns a message containing the wallet address and nonce.
3. The wallet signs the exact returned message.
4. The API verifies the detached Ed25519 signature against the wallet public key.
5. On success, the API rotates the nonce before issuing the JWT.
6. The JWT embeds `sub`, `walletAddress`, `role`, `status`, and `sessionVersion`.
7. Every authenticated request re-loads the user from the database and rejects the token if `sessionVersion` has changed.

That means a server-side session invalidation only requires incrementing the user’s session version.

## 3. API Key Security

API keys are handled as bearer secrets with hashed storage.

1. The API generates a plaintext key once.
2. The plaintext key is SHA-256 hashed before storage.
3. The database stores only `keyHash`, the visible prefix, scopes, expiry, and status.
4. The gateway hashes the presented key and matches against the stored hash.
5. Revoked or expired keys are rejected.
6. Standard relay requests require `rpc:request`.
7. Priority relay requests require both `rpc:request` and `priority:relay`.
8. Under-scoped keys are rejected with a clear `403 insufficient_api_key_scope` response.

## 4. Gateway Controls

The gateway is the main abuse boundary for traffic.

1. It requires an API key for every relay request.
2. It applies mode-specific rate limits through Redis.
3. It prices requests deterministically from the JSON RPC payload.
4. It refuses requests when the project’s on-chain balance minus Redis-recorded spend is insufficient.
5. It records every request outcome to PostgreSQL.
6. It emits structured logs with project ID, API key ID, methods, upstream node, asset charged, and duration.

The spend cache is fast, but it is still a Redis-backed operational layer. A production deployment should treat Redis durability and replication as part of the security story, not just an availability concern.

## 5. On-Chain Safety

The Anchor program enforces the money movement invariants.

1. Protocol-owned accounts are PDA derived.
2. Treasury, project, registry, operator, and reward accounts are cross-checked before mutation.
3. The configured USDC mint is enforced on token flows.
4. Claims require the correct operator signer.
5. Reward accrual requires the project owner signer.
6. Checked arithmetic is used for tracked balance movement.
7. The pause flag can halt project creation, deposits, operator registration, reward accrual, and reward claims.

The protocol also caps fee configuration at 20 percent.

## 6. Idempotency and Request Replay

Mutation endpoints that create projects, create API keys, and prepare funding transactions support idempotency.

1. The client sends `idempotency-key`.
2. The API hashes the request body.
3. The API stores a record keyed by `key`, `method`, `route`, and actor.
4. A matching request with the same hash replays the previous response.
5. A matching request with a different hash is rejected with a conflict.

This is a practical control against accidental duplicate funding preparation and repeated key creation under retries.

## 7. Operational Security Requirements

A production deployment still needs operational hygiene around the code that already exists.

1. Use a strong `API_JWT_SECRET`. The development default is only for local use.
2. Put TLS in front of the API, gateway, and frontend.
3. Run PostgreSQL with backups and Redis with persistence or replication.
4. Restrict direct database exposure to private networking.
5. Monitor `/health` and `/v1/status` on the API and gateway.
6. Audit who controls the Anchor upgrade authority and protocol authority.

## 8. Known Gaps Before Mainnet

The repository is strong for devnet, but the following items are still open from a security standpoint:

1. Protocol fee withdrawal is not implemented.
2. Program authority governance is still single-authority based.
3. Reward snapshots are off chain and need an explicit reviewed bridge to on-chain accrual.
4. Redis spend tracking should be reviewed for persistence, replay behavior, and multi-region coordination.
5. Request-log retention, IP handling, and audit policy still need to be formalized before mainnet beta.

Those gaps are not hidden defects. They are current system boundaries and should stay documented as such.
