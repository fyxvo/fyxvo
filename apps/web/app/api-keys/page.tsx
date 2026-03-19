"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal, Notice, Table, type TableColumn } from "@fyxvo/ui";
import { CopyButton } from "../../components/copy-button";
import { PageHeader } from "../../components/page-header";
import { AuthGate } from "../../components/state-panels";
import { usePortal } from "../../components/portal-provider";
import { webEnv } from "../../lib/env";
import { formatRelativeDate } from "../../lib/format";
import type { PortalApiKey } from "../../lib/types";

const columns: readonly TableColumn<PortalApiKey>[] = [
  {
    key: "label",
    header: "Key",
    cell: (apiKey) => (
      <div>
        <div className="font-medium text-white">{apiKey.label}</div>
        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{apiKey.prefix}</div>
      </div>
    )
  },
  {
    key: "scopes",
    header: "Scopes",
    cell: (apiKey) => (
      <div className="flex flex-wrap gap-2">
        {apiKey.scopes.map((scope) => (
          <Badge key={scope} tone="neutral">
            {scope}
          </Badge>
        ))}
      </div>
    )
  },
  {
    key: "lastUsed",
    header: "Last used",
    cell: (apiKey) => (apiKey.lastUsedAt ? formatRelativeDate(apiKey.lastUsedAt) : "Never")
  },
  {
    key: "status",
    header: "Status",
    cell: (apiKey) => <Badge tone={apiKey.status === "ACTIVE" ? "success" : "danger"}>{apiKey.status}</Badge>
  }
];

export default function ApiKeysPage() {
  const portal = usePortal();
  const [label, setLabel] = useState("Priority relay");
  const [scopes, setScopes] = useState("project:read, rpc:request, priority:relay");
  const [expiresAt, setExpiresAt] = useState("");
  const [open, setOpen] = useState(false);
  const exampleApiKey = portal.lastGeneratedApiKey ?? "YOUR_API_KEY";
  const standardRequest = `curl -X POST ${webEnv.gatewayBaseUrl}/rpc \\
  -H "content-type: application/json" \\
  -H "x-api-key: ${exampleApiKey}" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`;
  const priorityRequest = `curl -X POST ${webEnv.gatewayBaseUrl}/priority \\
  -H "content-type: application/json" \\
  -H "x-api-key: ${exampleApiKey}" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}'`;
  const rateLimitedCount = portal.projectAnalytics.statusCodes.find((entry) => entry.statusCode === 429)?.count ?? 0;
  const availableSolCredits = (() => {
    try {
      return BigInt(portal.onchainSnapshot.balances?.availableSolCredits ?? "0");
    } catch {
      return 0n;
    }
  })();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="API keys"
        title="Create project keys with clear scope and predictable usage."
        description="Projects can carry separate credentials for relay traffic, analytics, and internal tools without turning access control into guesswork for the rest of the team."
        actions={
          <Button onClick={() => setOpen(true)} disabled={portal.walletPhase !== "authenticated"}>
            Generate key
          </Button>
        }
      />

      {portal.walletPhase !== "authenticated" ? <AuthGate body="Connect Phantom to list live keys, generate new credentials, and revoke compromised ones." /> : null}

      {portal.lastGeneratedApiKey ? (
        <Notice tone="success" title="New API key generated">
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="break-all text-white">{portal.lastGeneratedApiKey}</span>
            <CopyButton value={portal.lastGeneratedApiKey} />
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--fyxvo-text-soft)]">
            Copy it now. This is the only time the full key is shown. The request examples below will automatically use it while this page stays open.
          </p>
        </Notice>
      ) : null}
      {portal.selectedProject && !portal.onchainSnapshot.projectAccountExists ? (
        <Notice tone="warning" title="Project activation still required">
          Keys can be created now, but the gateway will only honor them once the selected project has confirmed activation on chain.
        </Notice>
      ) : null}
      {portal.selectedProject && availableSolCredits === 0n ? (
        <Notice tone="warning" title="Funding still required">
          The key path is ready, but funded relay usage still depends on project balance. Open funding before handing this endpoint to teammates.
        </Notice>
      ) : null}
      <Notice tone="neutral" title="Scope enforcement is live on the gateway">
        Standard relay now requires <code>rpc:request</code>. Priority relay requires both <code>rpc:request</code> and <code>priority:relay</code>. Under-scoped keys are rejected with a clear gateway error instead of silently behaving like full-access keys.
      </Notice>
      {rateLimitedCount > 0 ? (
        <Notice tone="neutral" title="Observed rate-limit pressure">
          This project has already seen {rateLimitedCount} rate-limited responses. Keep standard and priority traffic separated so the team can reason about usage more clearly.
        </Notice>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Table columns={columns} rows={portal.apiKeys} getRowKey={(item) => item.id} />

        <Card className="fyxvo-surface border-white/5">
          <CardHeader>
            <CardTitle>Endpoint defaults</CardTitle>
            <CardDescription>
              Keep credentials close to the routes they unlock. This makes it harder for teams to accidentally use a broad key where a narrower one would do.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Standard relay</div>
              <div className="mt-2 text-sm font-medium text-white">POST /rpc</div>
              <div className="mt-2 text-xs text-slate-400">Required scope: rpc:request</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Priority relay</div>
              <div className="mt-2 text-sm font-medium text-white">POST /priority</div>
              <div className="mt-2 text-xs text-slate-400">
                Required scopes: rpc:request, priority:relay
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Analytics</div>
              <div className="mt-2 text-sm font-medium text-white">GET /v1/analytics/overview</div>
            </div>
            {!portal.selectedProject ? (
              <Notice tone="neutral" title="Create a project first">
                API keys belong to a specific project. Activate one project, then return here to issue the first relay key.
              </Notice>
            ) : null}
            {portal.apiKeys.length === 0 ? (
              <Notice tone="neutral" title="No keys yet">
                Start with one standard relay key. Add a separate priority key only when a workload really needs tighter latency control.
              </Notice>
            ) : null}
            <Notice tone="neutral" title="Team usage note">
              The current launch model is still owner-admin driven. You can issue distinct keys for workloads today, but shared collaborator roles are not yet presented as live product functionality.
            </Notice>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Make the first standard request</CardTitle>
            <CardDescription>
              This is the quickest way to confirm the project, funding, gateway, and logging path are all connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4 text-xs leading-6 text-[var(--fyxvo-text-soft)]">
              <code>{standardRequest}</code>
            </pre>
            <div className="flex flex-wrap gap-3">
              <CopyButton value={standardRequest} label="Copy standard request" />
              <CopyButton value={`${webEnv.gatewayBaseUrl}/rpc`} label="Copy endpoint" />
            </div>
          </CardContent>
        </Card>

        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Use priority only when it helps</CardTitle>
            <CardDescription>
              Priority mode is separate on purpose. It carries different routing and pricing logic, so teams should opt in deliberately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4 text-xs leading-6 text-[var(--fyxvo-text-soft)]">
              <code>{priorityRequest}</code>
            </pre>
            <div className="flex flex-wrap gap-3">
              <CopyButton value={priorityRequest} label="Copy priority request" />
              <CopyButton value={`${webEnv.gatewayBaseUrl}/priority`} label="Copy priority endpoint" />
            </div>
            <Notice tone="neutral" title="Need help choosing the right key split?">
              Use the pricing and contact paths when the team needs a cleaner boundary between standard traffic, priority relay traffic, and analytics-only access.
            </Notice>
            <Notice tone="warning" title="Priority scope is intentionally explicit">
              A priority key should still include <code>rpc:request</code>. That keeps the key capable of normal relay traffic while making the priority permission visible during audits and support reviews.
            </Notice>
          </CardContent>
        </Card>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate an API key"
        description="Pick a clear label and only the scopes this client truly needs."
        footer={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              onClick={async () => {
                await portal.createApiKey({
                  label,
                  scopes: scopes.split(",").map((scope) => scope.trim()).filter(Boolean),
                  ...(expiresAt ? { expiresAt } : {})
                });
                setOpen(false);
              }}
            >
              Generate
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <Input label="Label" value={label} onChange={(event) => setLabel(event.target.value)} />
          <Input
            label="Scopes"
            hint="Comma-separated scopes such as project:read, rpc:request, priority:relay. Priority keys must also include rpc:request."
            value={scopes}
            onChange={(event) => setScopes(event.target.value)}
          />
          <Input
            label="Expires at"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
