# Monitoring Guide

## 1. What To Watch First

Fyxvo exposes enough signal to monitor the live devnet stack without inventing new credentials or adding a third-party dependency in source.

1. `GET /health` on the API confirms database reachability and protocol readiness.
2. `GET /v1/status` on the API confirms protocol readiness, accepted asset state, and dependency configuration.
3. `GET /health`, `GET /v1/status`, and `GET /v1/metrics` on the gateway confirm relay availability, upstream reachability, latency, and success rate.
4. `GET /v1/admin/overview` on the API gives admin sessions a secure view of worker freshness, recent errors, recent funding events, and recent project activity.
5. Structured logs from the API, gateway, and worker provide the operational timeline when something changes faster than the status surfaces refresh.
6. `GET /v1/admin/overview` also includes recent API key activity and launch funnel counts, which helps separate onboarding friction from actual relay instability.

## 2. Recommended Checks

Run these checks continuously from your monitoring system:

1. API health at `https://api.fyxvo.com/health`
2. API status at `https://api.fyxvo.com/v1/status`
3. Gateway health at `https://rpc.fyxvo.com/health`
4. Gateway status at `https://rpc.fyxvo.com/v1/status`
5. Gateway metrics at `https://rpc.fyxvo.com/v1/metrics`
6. Frontend and status surface reachability at `https://www.fyxvo.com` and `https://status.fyxvo.com`

The public status page should not replace direct monitoring. It is the honest public trust surface, not the only operational source.

## 3. Alert Triggers

These are the first alerts worth wiring:

1. API health is not `ok` for more than 2 consecutive minutes.
2. API `protocolReadiness.ready` becomes `false`.
3. Gateway health is not `ok` for more than 2 consecutive minutes.
4. Gateway `upstreamReachable` becomes `false`.
5. Gateway standard success rate falls below `97%` for 5 minutes.
6. Gateway priority success rate falls below `99%` for 5 minutes if priority mode is in use.
7. Gateway standard average latency exceeds your accepted threshold for 5 minutes.
8. Worker freshness falls outside the `staleThresholdMinutes` window shown by `GET /v1/admin/overview`.
9. Repeated `402 insufficient_project_funds` responses appear for a project that should be funded.
10. Repeated `429 rate_limited` responses appear unexpectedly for one project or API key.

## 4. Structured Log Events

Fyxvo now emits alert-ready structured events in the main runtime paths.

1. API request completion logs emit `event=api.request.completed`.
2. API request failures emit `event=api.request.error`.
3. Gateway request completion logs emit `event=gateway.request.completed`.
4. Gateway handler failures emit `event=gateway.request.error`.
5. Worker job completions emit `event=worker.job.completed`.
6. Worker job failures emit `event=worker.job.failed`.
7. Worker runtime lifecycle logs emit `event=worker.runtime.started`, `event=worker.runtime.enqueue_failed`, and `event=worker.runtime.stopped`.
8. Startup failures emit `event=api.startup.failed`, `event=gateway.startup.failed`, and `event=worker.startup.failed`.

Route these logs to your platform log sink and alert on rate changes for the error events before you alert on every single line.

## 5. What The Admin Overview Means

`GET /v1/admin/overview` is meant for internal sessions, not public dashboards.

1. `worker.status=healthy` means the latest worker cursor or usage rollup is fresh enough.
2. `worker.status=attention` means the worker has not updated recently enough and should be checked.
3. `worker.status=idle` means no worker cursor or rollup has been recorded yet.
4. `recentErrors` is pulled from real request logs with status codes `>= 400`.
5. `recentFundingEvents` is pulled from real funding coordinates and shows whether funding is only prepared or already confirmed.
6. `recentProjectActivity` is pulled from real project-scoped request logs and helps answer whether new user flows are actually landing.
7. `recentApiKeyActivity` helps explain whether teams are actively rotating or testing keys.
8. `launchFunnel` turns first-party product events into a lightweight conversion view without adding a third-party tracker.

## 6. Devnet Reminder

Fyxvo is still running on Solana devnet.

1. SOL is the live public funding path.
2. USDC remains configuration-gated until you intentionally enable it.
3. Managed operator infrastructure is live and should be described honestly as managed infrastructure.
4. Devnet instability is external noise. Alerting should distinguish between platform failures and upstream devnet turbulence where possible.
