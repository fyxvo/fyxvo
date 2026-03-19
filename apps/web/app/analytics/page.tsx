"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Notice,
} from "@fyxvo/ui";
import { BarChartCard, LineChartCard } from "../../components/charts";
import { MetricCard, DeltaBadge } from "../../components/metric-card";
import { PageHeader } from "../../components/page-header";
import { AuthGate } from "../../components/state-panels";
import { usePortal } from "../../components/portal-provider";
import { dashboardTrend } from "../../lib/sample-data";
import { formatDuration, formatInteger } from "../../lib/format";

export default function AnalyticsPage() {
  const portal = usePortal();
  const servicePoints = portal.analyticsOverview.requestsByService.map((entry) => ({
    label: entry.service,
    value: entry.count,
  }));
  const statusPoints = portal.projectAnalytics.statusCodes.map((entry) => ({
    label: String(entry.statusCode),
    value: entry.count,
  }));

  const hasData = portal.projectAnalytics.totals.requestLogs > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Know where the load is shaping up."
        description="Request volume, latency, error rates, and balance consumption tied to your project. Updated from real request logs."
      />

      {portal.walletPhase !== "authenticated" ? (
        <AuthGate body="Connect a wallet to replace the preview analytics with live project data from the API." />
      ) : null}

      {!hasData && portal.walletPhase === "authenticated" ? (
        <Notice tone="neutral" title="No request data yet">
          Send traffic to the gateway using your API key to populate these charts. The quickstart
          docs have a working curl example to get the first request in under a minute.
        </Notice>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Requests"
          value={formatInteger(portal.projectAnalytics.totals.requestLogs)}
          detail="Request volume attributed to the selected project."
          accent={<DeltaBadge value="project scope" />}
        />
        <MetricCard
          label="Average latency"
          value={formatDuration(portal.projectAnalytics.latency.averageMs)}
          detail="Useful for spotting throughput issues before users report them."
          accent={<DeltaBadge value="observed" />}
        />
        <MetricCard
          label="Funding requests"
          value={String(portal.projectAnalytics.totals.fundingRequests)}
          detail="Treasury prep requests made through the authenticated API workflow."
          accent={<Badge tone="brand">project scope</Badge>}
        />
        <MetricCard
          label="API keys"
          value={String(portal.projectAnalytics.totals.apiKeys)}
          detail="Credential surface currently mapped to this project."
          accent={<Badge tone="neutral">active</Badge>}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <LineChartCard
          title="Gateway and API pressure"
          description="A combined traffic profile helps distinguish routing pressure from backend orchestration pressure."
          points={dashboardTrend}
        />
        <BarChartCard
          title="Requests by service"
          description="Service distribution shows whether the gateway is carrying the expected load or if application traffic is shifting upstream."
          points={servicePoints}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BarChartCard
          title="Status code composition"
          description="Small slices of 402, 429, and 503 traffic matter because they reveal reserve pressure and failover conditions."
          points={statusPoints}
        />
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Why these charts exist</CardTitle>
            <CardDescription>
              Analytics are tuned to operational questions that show up during live devnet traffic,
              not generic reporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">
                Latency signal
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--fyxvo-text-soft)]">
                If the shape changes before the average does, you can rebalance nodes or funding
                before a degraded experience shows up.
              </div>
            </div>
            <div className="rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">
                Treasury signal
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--fyxvo-text-soft)]">
                402 and 429 traffic often maps back to reserve floors or pricing decisions, so it
                stays visible instead of buried in a log search.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
