"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Notice, Table, type TableColumn } from "@fyxvo/ui";
import { MetricCard } from "../../components/metric-card";
import { PageHeader } from "../../components/page-header";
import { AuthGate } from "../../components/state-panels";
import { usePortal } from "../../components/portal-provider";
import { fetchGatewayStatus } from "../../lib/api";
import { formatDuration, formatPercent, formatRelativeDate, shortenAddress } from "../../lib/format";
import { liveDevnetState } from "../../lib/live-state";
import type { OperatorSummary, PortalServiceStatus } from "../../lib/types";

const nodeColumns: readonly TableColumn<OperatorSummary["nodes"][number]>[] = [
  {
    key: "name",
    header: "Node",
    cell: (node) => (
      <div>
        <div className="font-medium text-[var(--fyxvo-text)]">{node.name}</div>
        <div className="text-xs uppercase tracking-[0.12em] text-[var(--fyxvo-text-muted)]">{node.region}</div>
      </div>
    )
  },
  {
    key: "status",
    header: "Status",
    cell: (node) => <Badge tone={node.status === "ONLINE" ? "success" : node.status === "DEGRADED" ? "warning" : "neutral"}>{node.status}</Badge>
  },
  {
    key: "reliability",
    header: "Reliability",
    cell: (node) => formatPercent((node.reliabilityScore ?? 0.9) * 100)
  },
  {
    key: "heartbeat",
    header: "Heartbeat",
    cell: (node) => (node.lastHeartbeatAt ? formatRelativeDate(node.lastHeartbeatAt) : "Unavailable")
  },
  {
    key: "errorRate",
    header: "Error rate",
    cell: (node) =>
      typeof node.latestMetrics?.errorRate === "number"
        ? formatPercent(node.latestMetrics.errorRate * 100)
        : "Pending"
  }
];

export default function OperatorsPage() {
  const portal = usePortal();
  const canViewAdmin = portal.user?.role === "OWNER" || portal.user?.role === "ADMIN";
  const [gatewayStatus, setGatewayStatus] = useState<PortalServiceStatus | null>(null);

  useEffect(() => {
    void fetchGatewayStatus()
      .then((status) => {
        setGatewayStatus(status);
      })
      .catch(() => {
        setGatewayStatus(null);
      });
  }, []);

  const operatorSummary = useMemo(() => {
    const nodes = portal.operators.flatMap((summary) => summary.nodes);
    const onlineNodes = nodes.filter((node) => node.status === "ONLINE").length;
    const degradedNodes = nodes.filter((node) => node.status === "DEGRADED").length;
    const avgReliability =
      nodes.length > 0
        ? nodes.reduce((sum, node) => sum + (node.reliabilityScore ?? 0), 0) / nodes.length
        : 0;

    return {
      totalNodes: nodes.length,
      onlineNodes,
      degradedNodes,
      avgReliability
    };
  }, [portal.operators]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operator dashboard"
        title="Track managed operator health, routing posture, and reward context."
        description="This surface is explicit about the current launch model: managed operator infrastructure today, with health, latency, and reward context kept visible for the teams running early traffic."
      />

      {!canViewAdmin ? (
        <AuthGate title="Admin access unlocks live operator data." body="The preview below shows the operator experience, and admin sessions replace it with the current platform roster from the API." />
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Operators"
          value={portal.adminStats ? String(portal.adminStats.totals.nodeOperators) : String(portal.operators.length)}
          detail="Managed operator supply visible to current admin sessions."
          accent={<Badge tone="brand">managed</Badge>}
        />
        <MetricCard
          label="Managed nodes"
          value={String(operatorSummary.totalNodes)}
          detail={`${operatorSummary.onlineNodes} online, ${operatorSummary.degradedNodes} degraded.`}
          accent={<Badge tone={operatorSummary.degradedNodes > 0 ? "warning" : "success"}>{operatorSummary.onlineNodes} online</Badge>}
        />
        <MetricCard
          label="Average reliability"
          value={operatorSummary.totalNodes > 0 ? formatPercent(operatorSummary.avgReliability * 100) : "Pending"}
          detail="Based on the worker-owned node health view."
          accent={<Badge tone="neutral">worker scored</Badge>}
        />
        <MetricCard
          label="Relay latency"
          value={
            typeof gatewayStatus?.metrics?.priority?.averageLatencyMs === "number"
              ? formatDuration(gatewayStatus.metrics.priority.averageLatencyMs)
              : typeof gatewayStatus?.metrics?.standard?.averageLatencyMs === "number"
                ? formatDuration(gatewayStatus.metrics.standard.averageLatencyMs)
                : "Pending"
          }
          detail="Pulled from the live hosted gateway status surface."
          accent={<Badge tone="success">{gatewayStatus?.nodeCount ?? operatorSummary.totalNodes} nodes</Badge>}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Managed operator launch posture</CardTitle>
            <CardDescription>
              The current launch path uses managed infrastructure first so routing and response quality stay predictable while early team traffic settles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Notice tone="neutral" title="What is live today">
              Managed operators participate in routing health, reward accrual context, and incident response. This page does not claim open decentralized supply that is not yet implemented.
            </Notice>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">Managed wallet</div>
                <div className="mt-2 text-sm font-medium text-[var(--fyxvo-text)]">{shortenAddress(liveDevnetState.managedOperatorWallet, 10, 8)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">Operator account</div>
                <div className="mt-2 text-sm font-medium text-[var(--fyxvo-text)]">{shortenAddress(liveDevnetState.managedOperatorAccount, 10, 8)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">Reward account</div>
                <div className="mt-2 text-sm font-medium text-[var(--fyxvo-text)]">{shortenAddress(liveDevnetState.managedRewardAccount, 10, 8)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/status">Open status</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/docs">Read docs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Operator role today and later</CardTitle>
            <CardDescription>
              Keep the current scope clear so early teams know what to expect on devnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Notice tone="success" title="Today">
              Fyxvo-managed operators provide the current launch supply, node monitoring, health scoring, and reward-context visibility.
            </Notice>
            <Notice tone="neutral" title="Later">
              External operator participation is a future expansion path. It is not marketed as live until registration, governance, and routing policies are ready for broader participation.
            </Notice>
            <Notice tone="neutral" title="Reward visibility">
              Reward accrual is real on chain, while this page stays focused on the managed operator account, reward account, and the worker-owned health signals that inform payout review.
            </Notice>
          </CardContent>
        </Card>
      </section>

      {portal.adminStats ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Users", String(portal.adminStats.totals.users)],
            ["Projects", String(portal.adminStats.totals.projects)],
            ["Nodes", String(portal.adminStats.totals.nodes)],
            ["Operators", String(portal.adminStats.totals.nodeOperators)]
          ].map(([label, value]) => (
            <Card key={label} className="fyxvo-surface border-[color:var(--fyxvo-border)]">
              <CardHeader>
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-[var(--fyxvo-text)]">{value}</CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <section className="grid gap-6">
        {portal.operators.map((summary) => (
          <Card key={summary.operator.id} className="fyxvo-surface border-[color:var(--fyxvo-border)]">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{summary.operator.name}</CardTitle>
                  <CardDescription>
                    {summary.operator.email} · reputation {(summary.operator.reputationScore ?? 0.96).toFixed(2)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">managed</Badge>
                  <Badge tone={summary.operator.status === "ACTIVE" ? "success" : "warning"}>{summary.operator.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">Managed wallet</div>
                  <div className="mt-2 text-sm font-medium text-[var(--fyxvo-text)]">{shortenAddress(summary.operator.walletAddress, 8, 8)}</div>
                </div>
                <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">Healthy nodes</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--fyxvo-text)]">
                    {summary.nodes.filter((node) => node.status === "ONLINE").length}/{summary.nodes.length}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">Last heartbeat</div>
                  <div className="mt-2 text-sm font-medium text-[var(--fyxvo-text)]">
                    {summary.nodes[0]?.lastHeartbeatAt ? formatRelativeDate(summary.nodes[0].lastHeartbeatAt) : "Pending"}
                  </div>
                </div>
              </div>
              <Notice tone="neutral" title="Why operator data matters">
                Routing preference, incident response, and reward review all look different when node health, error rate, and reputation stay visible in the same view.
              </Notice>
              <Table columns={nodeColumns} rows={summary.nodes} getRowKey={(node) => node.id} />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
