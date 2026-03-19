# Data Governance

## 1. What Fyxvo Stores

The live product stores operational data that should be handled deliberately before mainnet.

1. Wallet-linked users and session versions.
2. Project metadata and API key metadata.
3. Request logs, including route, method, status, timing, user agent, and IP address.
4. Funding coordination records.
5. Worker-derived wallet activity, token balances, transaction lookups, node health, and reward snapshots.

## 2. Retention Guidance

The repository does not enforce retention automatically yet. Mainnet beta should.

1. Keep raw request logs only as long as operations, abuse review, and product analytics truly need them.
2. Keep launch funnel and interest records long enough for follow-up, then archive or delete them on a schedule.
3. Keep wallet-activity indexing only if it is still product-critical for the environment.

## 3. Redaction Guidance

1. Do not log plaintext API keys.
2. Do not log wallet signatures beyond what a support or audit flow truly needs.
3. Treat full user agents and raw IP addresses as sensitive operational data.
4. Prefer structured summaries over dumping entire error objects or request bodies.

The API, gateway, and worker now favor structured startup and handler failure logs instead of raw error dumps.

## 4. Audit Guidance

Mainnet beta should add explicit audit logging around:

1. Admin-only endpoints.
2. API key creation and revocation.
3. Funding preparation and verification.
4. Any future fee-withdrawal flow.
5. Any future authority-change tooling.
