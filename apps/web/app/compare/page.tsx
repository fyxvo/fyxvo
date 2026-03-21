"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Notice } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";
import { usePortal } from "../../components/portal-provider";
import { formatDuration, formatInteger, formatPercent } from "../../lib/format";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeSuccessRate(analytics: {
  totals: { requestLogs: number };
  statusCodes: Array<{ statusCode: number; count: number }>;
}): string {
  const total = analytics.totals.requestLogs;
  if (!total) return "–";
  const success = analytics.statusCodes
    .filter((s) => s.statusCode < 400)
    .reduce((sum, s) => sum + s.count, 0);
  return formatPercent((success / total) * 100);
}

function extractSolBalance(onchain: {
  balances?: { availableSolCredits?: string };
  treasurySolBalance?: number;
}): string {
  if (onchain.balances?.availableSolCredits) {
    try {
      const lamports = Number(BigInt(onchain.balances.availableSolCredits));
      const sol = lamports / 1_000_000_000;
      return `${sol.toFixed(4)} SOL`;
    } catch {
      return "Unavailable";
    }
  }
  if (typeof onchain.treasurySolBalance === "number") {
    return `${onchain.treasurySolBalance.toFixed(4)} SOL`;
  }
  return "Unavailable";
}

// ---------------------------------------------------------------------------
// Mini bar chart using CSS only
// ---------------------------------------------------------------------------

interface MiniBarData {
  readonly label: string;
  readonly value: number;
}

function MiniBarChart({ data }: { readonly data: MiniBarData[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 64 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max(4, Math.round((d.value / max) * 52))}px`,
              background: "linear-gradient(180deg, var(--color-brand-400, #818cf8), var(--color-brand-500, #6366f1))",
            }}
          />
          <span className="truncate text-[9px] text-[var(--fyxvo-text-muted)]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CompareProjectsPage() {
  const portal = usePortal();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const projects = portal.projects;

  function toggleProject(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  }

  const selectedProjects = projects.filter((p) => selectedIds.includes(p.id));

  // Build comparison rows using portal.projectAnalytics (single selected project analytics)
  // and basic project data for other projects as fallback.
  const analyticsForProject = (projectId: string) => {
    if (portal.projectAnalytics.project.id === projectId) {
      return portal.projectAnalytics;
    }
    return null;
  };

  const totalRequests = (projectId: string): string => {
    const a = analyticsForProject(projectId);
    if (a) return formatInteger(a.totals.requestLogs);
    const p = projects.find((x) => x.id === projectId);
    return formatInteger(p?._count?.requestLogs ?? 0);
  };

  const successRate = (projectId: string): string => {
    const a = analyticsForProject(projectId);
    if (a) return computeSuccessRate(a);
    return "–";
  };

  const avgLatency = (projectId: string): string => {
    const a = analyticsForProject(projectId);
    if (a) return formatDuration(a.latency.averageMs);
    return "–";
  };

  const fundedBalance = (projectId: string): string => {
    if (portal.selectedProject?.id === projectId) {
      return extractSolBalance(portal.onchainSnapshot);
    }
    return "–";
  };

  // 7-day bar data — use daily analytics buckets from projectAnalytics if available for selected project
  const requestBarData = (projectId: string): MiniBarData[] => {
    const a = analyticsForProject(projectId);
    if (!a) {
      const p = projects.find((x) => x.id === projectId);
      return [{ label: "total", value: p?._count?.requestLogs ?? 0 }];
    }
    // recentRequests is the only time-series we have; group by day
    const byDay = new Map<string, number>();
    for (const req of a.recentRequests) {
      const day = req.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const days = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({ label: date.slice(5), value: count }));
    if (days.length === 0) return [{ label: "–", value: 0 }];
    return days;
  };

  const comparisonRows: Array<{
    label: string;
    getValue: (projectId: string) => string;
  }> = [
    { label: "Total requests", getValue: totalRequests },
    { label: "Success rate", getValue: successRate },
    { label: "Avg latency", getValue: avgLatency },
    { label: "Funded balance", getValue: fundedBalance },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compare"
        title="Compare Projects"
        description="Select up to 3 projects to compare key metrics side by side."
      />

      {/* Project selector */}
      <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
        <CardHeader>
          <CardTitle>Select projects</CardTitle>
          <CardDescription>Choose 2 or 3 projects to compare. Up to 3 can be selected at a time.</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <Notice tone="neutral" title="No projects">
              Create a project to get started.{" "}
              <Link href="/dashboard" className="text-[var(--fyxvo-brand)] underline">
                Go to Dashboard
              </Link>
            </Notice>
          ) : (
            <div className="flex flex-wrap gap-3">
              {projects.map((project) => {
                const checked = selectedIds.includes(project.id);
                const disabled = !checked && selectedIds.length >= 3;
                return (
                  <label
                    key={project.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 transition ${
                      checked
                        ? "border-brand-500 bg-brand-500/10 text-[var(--fyxvo-text)]"
                        : disabled
                          ? "cursor-not-allowed border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] opacity-40"
                          : "border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] text-[var(--fyxvo-text-soft)] hover:border-brand-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => { if (!disabled) toggleProject(project.id); }}
                    />
                    <span className="text-sm font-medium">{project.name}</span>
                    {project.environment !== "development" ? (
                      <Badge tone={project.environment === "production" ? "danger" : "warning"} className="text-[10px]">
                        {project.environment}
                      </Badge>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison table */}
      {selectedProjects.length < 2 ? (
        <Notice tone="neutral" title="Select at least 2 projects to compare">
          Pick projects above to see a side-by-side metric breakdown.
        </Notice>
      ) : (
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Metric comparison</CardTitle>
            <CardDescription>
              Live data shown where available. Balance reflects the currently selected project&apos;s on-chain snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--fyxvo-border)]">
                <tr>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]">
                    Metric
                  </th>
                  {selectedProjects.map((p) => (
                    <th
                      key={p.id}
                      className="pb-3 text-right text-xs font-medium uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]"
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fyxvo-border)]">
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 text-xs text-[var(--fyxvo-text-muted)]">{row.label}</td>
                    {selectedProjects.map((p) => (
                      <td key={p.id} className="py-3 text-right font-medium text-[var(--fyxvo-text)]">
                        {row.getValue(p.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 7-day request volume chart */}
      {selectedProjects.length >= 2 && (
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Request volume (last 7 days)</CardTitle>
            <CardDescription>
              Relative request distribution for the selected projects. Derived from recent request log data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selectedProjects.length}, 1fr)` }}>
              {selectedProjects.map((p) => (
                <div key={p.id}>
                  <p className="mb-2 text-xs font-medium text-[var(--fyxvo-text-muted)]">{p.name}</p>
                  <MiniBarChart data={requestBarData(p.id)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/analytics">View Analytics</Link>
        </Button>
      </div>
    </div>
  );
}
