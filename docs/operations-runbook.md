# Operations Runbook

## 1. Preflight Before Any Hosted Release

1. Run `pnpm lint`.
2. Run `pnpm typecheck`.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Run `pnpm test:anchor` before protocol-adjacent changes.
6. Verify `pnpm solana:protocol:verify` against the intended environment.
7. Review `/v1/status`, `/v1/admin/overview`, and `/v1/status` on the gateway in staging before promoting.

## 2. Database Migration Safety

1. Review Prisma schema and SQL migration output before release.
2. Apply migrations once per environment through the deployment process, not ad hoc shells.
3. Take a fresh backup before any irreversible schema migration.
4. Confirm the new API build starts cleanly against the migrated schema before rotating traffic.

## 3. Redis Durability

Redis carries real operational state in Fyxvo.

1. Rate limits are Redis-backed.
2. Gateway spend counters are Redis-backed.
3. Worker queue state is Redis-backed.

For mainnet-oriented environments:

1. Enable persistence or managed replication.
2. Document failover behavior for lost spend counters and queue state.
3. Rehearse the recovery path after a Redis failover or flush event.

## 4. Backup And Restore

1. PostgreSQL must have scheduled backups and tested restore steps.
2. Redis must have a documented durability plan appropriate to the environment.
3. Restore drills should include API boot, worker boot, gateway boot, and admin overview verification.
4. A restore is not complete until funding history, request logs, and worker freshness all look sane again.

## 5. Rollback

1. Prefer rolling back application deployments before attempting database rollback.
2. If a migration is not backward compatible, stop and restore from backup instead of improvising.
3. Confirm gateway health, API health, worker startup, and protocol readiness after rollback.

## 6. Incident Response

1. Start with `/health`, `/v1/status`, and `/v1/metrics`.
2. Check `/v1/admin/overview` for worker freshness, recent errors, recent funding, key activity, and protocol warnings.
3. Separate upstream RPC failure from protocol readiness failure before escalating.
4. If balances look wrong, compare treasury and project state on chain before blaming the gateway.
5. If the issue is protocol or treasury safety related, pause external change activity until the root cause is understood.
