"use client";

import Link from "next/link";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Notice, ProgressBar, Table, type TableColumn } from "@fyxvo/ui";
import { BarChartCard } from "../../../components/charts";
import { CopyButton } from "../../../components/copy-button";
import { PageHeader } from "../../../components/page-header";
import { AuthGate } from "../../../components/state-panels";
import { usePortal } from "../../../components/portal-provider";
import { fundingTrend } from "../../../lib/sample-data";
import { formatDuration, formatInteger, shortenAddress } from "../../../lib/format";
import { webEnv } from "../../../lib/env";
import type { ProjectAnalytics } from "../../../lib/types";

const requestColumns: readonly TableColumn<ProjectAnalytics["recentRequests"][number]>[] = [
  {
    key: "route",
    header: "Route",
    cell: (request) => (
      <div>
        <div className="font-medium text-white">{request.route}</div>
        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{request.method}</div>
      </div>
    )
  },
  {
    key: "service",
    header: "Service",
    cell: (request) => request.service
  },
  {
    key: "status",
    header: "Status",
    cell: (request) => <Badge tone={request.statusCode < 400 ? "success" : "warning"}>{request.statusCode}</Badge>
  },
  {
    key: "duration",
    header: "Latency",
    cell: (request) => formatDuration(request.durationMs)
  }
];

export default function ProjectPage({
  params
}: {
  readonly params: { slug: string };
}) {
  const portal = usePortal();
  const project =
    portal.projects.find((item) => item.slug === params.slug) ??
    portal.selectedProject ??
    portal.projects[0] ??
    null;

  if (!project) {
    return <AuthGate title="Connect a wallet to resolve a project." body="Project routes resolve against the authenticated workspace when a wallet session is active." />;
  }

  const availableSolCredits = (() => {
    try {
      return BigInt(portal.onchainSnapshot.balances?.availableSolCredits ?? "0");
    } catch {
      return 0n;
    }
  })();
  const totalSolFunded = (() => {
    try {
      return BigInt(portal.onchainSnapshot.balances?.totalSolFunded ?? "0");
    } catch {
      return 0n;
    }
  })();
  const hasLowBalance = availableSolCredits > 0n && availableSolCredits < 100_000_000n;
  const rateLimitedCount = portal.projectAnalytics.statusCodes.find((entry) => entry.statusCode === 429)?.count ?? 0;
  const reservePercentage = Math.min(100, Math.round((portal.onchainSnapshot.treasurySolBalance / 25_000_000_000) * 100));
  const projectUrl = `${webEnv.siteUrl}/projects/${project.slug}`;
  const projectReadyStates = [
    {
      label: "Activated",
      ready: portal.onchainSnapshot.projectAccountExists,
      body: "The on-chain project account exists and can accept funded relay traffic."
    },
    {
      label: "Funded",
      ready: (project._count?.fundingRequests ?? 0) > 0,
      body: "At least one funding coordinate has been prepared or confirmed for this project."
    },
    {
      label: "Keys issued",
      ready: (project._count?.apiKeys ?? 0) > 0,
      body: "An API key exists for sending standard or priority relay traffic."
    },
    {
      label: "Traffic observed",
      ready: portal.projectAnalytics.totals.requestLogs > 0,
      body: "Request logs are already landing, so analytics and status surfaces are reacting."
    }
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project page"
        title={project.name}
        description={project.description ?? "This project is ready for funded devnet traffic, signed funding flows, and workspace-level analytics."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{project.slug}</Badge>
            <Badge tone={project.ownerId === portal.user?.id ? "success" : "neutral"}>
              {project.ownerId === portal.user?.id ? "owner session" : "workspace view"}
            </Badge>
          </div>
        }
      />

      {portal.walletPhase !== "authenticated" ? <AuthGate body="You can preview the project surface now, then connect Phantom to load real API keys, analytics, and on-chain balances." /> : null}

      <section className="grid gap-4">
        <Notice tone="neutral" title="Team-readiness posture">
          Fyxvo is ready for real team workflows in terms of project funding, analytics, and support visibility, but the current access model is still owner-admin driven. Shared collaborator roles are the next honest step and are not presented as live yet.
        </Notice>
        {availableSolCredits === 0n ? (
          <Notice tone="warning" title="No spendable project balance">
            The gateway will reject funded relay usage until this project has confirmed SOL credits on chain. Activate the project, fund it, then generate or reuse an API key.
          </Notice>
        ) : null}
        {hasLowBalance ? (
          <Notice tone="warning" title="Low spendable balance">
            This project still has credits, but the remaining SOL buffer is low. Top up before the team leans on priority traffic or sustained relay usage.
          </Notice>
        ) : null}
        {rateLimitedCount > 0 ? (
          <Notice tone="neutral" title="Rate-limit pressure detected">
            This project has already seen {formatInteger(rateLimitedCount)} rate-limited responses. Review traffic shape, funding posture, and the standard versus priority path before widening team usage.
          </Notice>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Project PDA</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-300">{project.onChainProjectPda}</CardContent>
        </Card>
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Owner wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-300">{shortenAddress(project.owner.walletAddress, 8, 8)}</CardContent>
        </Card>
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{formatInteger(portal.projectAnalytics.totals.requestLogs)}</CardContent>
        </Card>
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Spendable SOL</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">
            {Number(availableSolCredits) / 1_000_000_000 > 0
              ? `${(Number(availableSolCredits) / 1_000_000_000).toFixed(3)} SOL`
              : "0 SOL"}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Treasury readiness</CardTitle>
            <CardDescription>
              The project treasury shows how much runway is left before standard relay capacity should be topped up again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">SOL treasury balance</div>
              <div className="mt-3 text-4xl font-semibold text-white">
                {(portal.onchainSnapshot.treasurySolBalance / 1_000_000_000).toFixed(2)} SOL
              </div>
            </div>
            <ProgressBar value={reservePercentage} label="Reserve headroom" />
            <Notice tone="neutral" title="Funding path">
              Route-level funding stays separate from on-chain ownership. The treasury is controlled by the protocol program, while deposits can be prepared from the frontend and approved in Phantom.
            </Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Total funded</div>
                <div className="mt-3 text-2xl font-semibold text-white">{(Number(totalSolFunded) / 1_000_000_000).toFixed(3)} SOL</div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Observed rate limits</div>
                <div className="mt-3 text-2xl font-semibold text-white">{formatInteger(rateLimitedCount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <BarChartCard
          title="Funding rhythm"
          description="This view highlights how reserve changes across the week so project owners can top up before gateway costs start to compete with priority traffic."
          points={fundingTrend}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Project readiness</CardTitle>
            <CardDescription>
              These checks keep activation, funding, API keys, and observed traffic close together so the next action is obvious.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {projectReadyStates.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-white">{item.label}</div>
                  <Badge tone={item.ready ? "success" : "neutral"}>{item.ready ? "ready" : "next"}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Ownership, sharing, and support</CardTitle>
            <CardDescription>
              Use these links when the project needs clearer ownership cues, a shareable status path, or direct product follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Notice tone="neutral" title="Current access model">
              The owner wallet is the live control point today. Admin sessions can review broader platform state, but collaborator roles are still a prepared next step rather than a shipped claim.
            </Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Owner wallet</div>
                <div className="mt-2 text-sm font-medium text-white">{project.owner.displayName}</div>
                <div className="mt-1 text-xs text-slate-400">{shortenAddress(project.owner.walletAddress, 8, 8)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Shareable links</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <CopyButton value={projectUrl} label="Copy project URL" />
                  <CopyButton value={webEnv.statusPageUrl} label="Copy status URL" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/funding">Open funding</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/api-keys">Manage API keys</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/pricing">View pricing</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contact">Request access</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Status code distribution</CardTitle>
            <CardDescription>
              Successful traffic dominates, and the smaller edges of the distribution still matter because they expose reserve and rate-limit pressure quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {portal.projectAnalytics.statusCodes.map((entry) => (
              <div key={entry.statusCode} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-white">{entry.statusCode}</span>
                  <span className="text-slate-400">{formatInteger(entry.count)} events</span>
                </div>
                <ProgressBar value={(entry.count / portal.projectAnalytics.totals.requestLogs) * 100} className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Table
          columns={requestColumns}
          rows={portal.projectAnalytics.recentRequests}
          getRowKey={(request) => request.id}
        />
      </section>
    </div>
  );
}
