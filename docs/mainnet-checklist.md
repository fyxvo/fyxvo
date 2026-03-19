# Mainnet Checklist

## 1. Program Governance

Mainnet should not ship with the current authority model unchanged.

1. Move the Anchor upgrade authority to a governed signer or multisig.
2. Move the protocol authority that controls pause and fee configuration to a governed signer or multisig.
3. Document the emergency pause procedure and unpause procedure with named owners.
4. Add an audited fee withdrawal instruction before revenue is expected on mainnet.

## 2. Asset and Treasury Readiness

Mainnet means real money, so the current devnet assumptions must be replaced deliberately.

1. Replace the devnet USDC mint with the intended production mint.
2. Verify the configured mint in both the program initialization flow and API environment.
3. Decide whether SOL-only, USDC-only, or dual-asset funding is supported at launch.
4. Define treasury reconciliation between on-chain balances, protocol fees owed, and gateway spend counters.
5. Decide how stale Redis spend state is recovered after outages or failover.

## 3. Gateway Enforcement Gaps

The gateway is operationally strong today, but there are concrete gaps before mainnet.

1. Expand the scoped-key model beyond relay permission if analytics-only, funding-only, or operator-facing automation keys will exist on mainnet.
2. Add rate-limit segmentation beyond the current API key bucket if tenant isolation needs IP or org dimensions.
3. Decide whether `simulateTransaction` should really share the same write multiplier as `sendTransaction`.
4. Add upstream node authentication or private networking if nodes are not intended to be public endpoints.
5. Define the production policy for degraded nodes under priority traffic.

## 4. API and Session Hardening

The API already has a good skeleton, but mainnet needs stronger operating assumptions.

1. Rotate `API_JWT_SECRET` through a secret manager, not a checked-in env file.
2. Add explicit session revocation tooling by incrementing `sessionVersion`.
3. Decide retention and redaction policy for `RequestLog`, `WalletActivity`, and `TransactionLookup`.
4. Review whether request IDs, user agents, and IP addresses must be anonymized or shortened for compliance.
5. Add audit logging around admin endpoints and high-risk mutations.

## 5. Reward Pipeline Readiness

The worker computes reward snapshots, but mainnet needs a decision about settlement authority.

1. Decide whether `OperatorRewardSnapshot` stays advisory or becomes the source for automated accrual.
2. If it becomes automated, define the signer that submits `accrue_reward` and who audits that submission path.
3. Freeze the reward formula or version it explicitly.
4. Define a dispute path for operators who disagree with request attribution or uptime weighting.
5. Backfill and replay procedures should be documented for when indexing falls behind.

## 6. Infrastructure Readiness

Mainnet requires production operations, not just working code.

1. Run PostgreSQL with backups, restore drills, and connection pool sizing.
2. Run Redis with persistence or replication appropriate for spend and queue durability.
3. Set SLOs for API health, gateway success rate, and worker lag.
4. Monitor `/health` and `/v1/status` endpoints continuously.
5. Track gateway latency, upstream failure rate, and project funding exhaustion as first-class alerts.
6. Confirm the gateway image is built and scanned in the exact form that will be deployed.

## 7. Release Procedure

A mainnet release should be a planned cutover, not a single push.

1. Freeze schema changes and Anchor IDL changes for the release window.
2. Run the full repository validation suite, including `pnpm test:anchor`.
3. Deploy API, worker, and gateway to a production-like staging environment first.
4. Fund a staging project and execute real relay traffic end to end.
5. Verify funding preparation, on-chain deposit, gateway billing, request logging, analytics rollups, node health updates, and reward snapshot output in one staged run.
6. Only after that staged flow passes should the governed authority initialize or upgrade the mainnet program state.

## 8. Honest Current Status

The repository is far along, but this is the real status today:

1. The product is production-structured.
2. The devnet flows are real.
3. The contract tests, API tests, gateway tests, worker tests, and frontend tests exist.
4. The deployment targets are prepared.
5. The system still needs governance, fee withdrawal, data-governance policy, and mainnet operational hardening before it should handle irreversible value at scale.
