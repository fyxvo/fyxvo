"use client";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@fyxvo/ui";
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
    value: entry.count
  }));
  const statusPoints = portal.projectAnalytics.statusCodes.map((entry) => ({
    label: String(entry.statusCode),
    value: entry.count
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Know where the load is shaping up."
        description="The analytics surface stays close to routing and treasury behavior so operators can see why latency changed, not just that it changed."
      />

      {portal.walletPhase !== "authenticated" ? <AuthGate body="Connect Phantom to replace the preview analytics with live project data from the API." /> : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Requests"
          value={formatInteger(portal.projectAnalytics.totals.requestLogs)}
          detail="Recent request volume attributed to the selected project."
          accent={<DeltaBadge value="+18% vs last window" />}
        />
        <MetricCard
          label="Average latency"
          value={formatDuration(portal.projectAnalytics.latency.averageMs)}
          detail="Useful for spotting throughput issues before users report them."
          accent={<DeltaBadge value="-6 ms" />}
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
          accent={<Badge tone="neutral">managed</Badge>}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <LineChartCard
          title="Gateway and API pressure"
          description="A combined traffic profile helps operators tell the difference between routing pressure and backend orchestration pressure."
          points={dashboardTrend}
        />
        <BarChartCard
          title="Requests by service"
          description="Service distribution quickly shows whether the gateway is carrying the load you expect or if application traffic is shifting upstream."
          points={servicePoints}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BarChartCard
          title="Status code composition"
          description="Small slices of 402, 429, and 503 traffic matter because they reveal reserve pressure and failover conditions long before totals look alarming."
          points={statusPoints}
        />
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Why these charts exist</CardTitle>
            <CardDescription>
              Fyxvo does not treat analytics as a reporting tab that lives far away from the action. The charts are tuned to the operational questions that show up during live devnet traffic.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Latency signal</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                If the shape changes before the average does, the team can rebalance nodes or funding before a degraded experience shows up.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Treasury signal</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                402 and 429 traffic often map back to reserve floors or pricing decisions, so they stay visible instead of buried in a log search.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
