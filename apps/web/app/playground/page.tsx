"use client";

import { useState, useCallback } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Notice } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";
import { usePortal } from "../../components/portal-provider";
import { webEnv } from "../../lib/env";

// ---------------------------------------------------------------------------
// RPC method catalogue
// ---------------------------------------------------------------------------

type MethodParam = {
  name: string;
  placeholder: string;
  required: boolean;
};

type RpcMethod = {
  method: string;
  category: string;
  description: string;
  params: MethodParam[];
};

const RPC_METHODS: RpcMethod[] = [
  // Network
  { method: "getHealth", category: "Network", description: "Returns the current health of the node.", params: [] },
  { method: "getVersion", category: "Network", description: "Returns the current Solana version running on the node.", params: [] },
  { method: "getSlot", category: "Network", description: "Returns the slot that has reached the given or default commitment level.", params: [] },
  { method: "getBlockHeight", category: "Network", description: "Returns the current block height of the node.", params: [] },
  { method: "getEpochInfo", category: "Network", description: "Returns information about the current epoch.", params: [] },
  // Account
  { method: "getBalance", category: "Account", description: "Returns the lamport balance of the account.", params: [{ name: "pubkey", placeholder: "Base58 account public key", required: true }] },
  { method: "getAccountInfo", category: "Account", description: "Returns all information associated with the account.", params: [{ name: "pubkey", placeholder: "Base58 account public key", required: true }] },
  { method: "getTokenAccountBalance", category: "Account", description: "Returns the token balance of an SPL Token account.", params: [{ name: "pubkey", placeholder: "SPL Token account public key", required: true }] },
  {
    method: "getProgramAccounts",
    category: "Account",
    description: "Returns all accounts owned by the provided program. Compute-heavy.",
    params: [{ name: "programId", placeholder: "Program public key", required: true }],
  },
  // Transaction
  { method: "getTransaction", category: "Transaction", description: "Returns transaction details.", params: [{ name: "signature", placeholder: "Transaction signature (base58)", required: true }] },
  { method: "getSignaturesForAddress", category: "Transaction", description: "Returns confirmed signatures for transactions involving an address.", params: [{ name: "pubkey", placeholder: "Base58 account public key", required: true }] },
  // Block
  { method: "getBlock", category: "Block", description: "Returns identity and transaction information about a confirmed block.", params: [{ name: "slot", placeholder: "Slot number (integer)", required: true }] },
  { method: "getLatestBlockhash", category: "Block", description: "Returns the latest blockhash.", params: [] },
  { method: "isBlockhashValid", category: "Block", description: "Returns whether a given blockhash is still valid.", params: [{ name: "blockhash", placeholder: "Blockhash string", required: true }] },
];

const CATEGORIES = [...new Set(RPC_METHODS.map((m) => m.category))];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface HistoryItem {
  id: string;
  method: string;
  mode: "standard" | "priority";
  durationMs: number;
  statusCode: number;
  requestedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlaygroundPage() {
  const portal = usePortal();
  const isAuthenticated = portal.walletPhase === "authenticated";

  const [selectedCategory, setSelectedCategory] = useState("Network");
  const [selectedMethod, setSelectedMethod] = useState<RpcMethod>(RPC_METHODS[0]!);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"standard" | "priority">("standard");
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selectMethod = useCallback((m: RpcMethod) => {
    setSelectedMethod(m);
    setParamValues({});
    setResponse(null);
    setError(null);
    setDurationMs(null);
  }, []);

  const activeApiKey = portal.apiKeys.find((k) => k.id === selectedKeyId && k.status === "ACTIVE") ??
    portal.apiKeys.find((k) => k.status === "ACTIVE");

  async function sendRequest() {
    if (!isAuthenticated) return;

    // Build JSON-RPC params array
    const methodDef = selectedMethod;
    const rpcParams: unknown[] = methodDef.params.map((p) => {
      const v = paramValues[p.name] ?? "";
      // Try to parse numbers for slot fields
      if (p.name === "slot") return isNaN(Number(v)) ? v : Number(v);
      return v || undefined;
    }).filter((v) => v !== undefined);

    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: methodDef.method,
      params: rpcParams.length > 0 ? rpcParams : undefined,
    });

    const gatewayBase = webEnv.apiBaseUrl.replace("/api", "").replace(":3001", ":3002");
    const endpoint = mode === "priority" ? `${gatewayBase}/priority` : `${gatewayBase}/rpc`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (activeApiKey) headers["x-api-key"] = `${activeApiKey.prefix}...`;

    setLoading(true);
    setError(null);
    setResponse(null);
    setDurationMs(null);
    const start = Date.now();

    try {
      const res = await fetch(endpoint, { method: "POST", headers, body });
      const elapsed = Date.now() - start;
      setDurationMs(elapsed);
      const text = await res.text();
      try {
        const json = JSON.parse(text) as unknown;
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          method: methodDef.method,
          mode,
          durationMs: elapsed,
          statusCode: res.status,
          requestedAt: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Developer Tools"
        title="API Playground"
        description="Send live JSON-RPC requests to the Fyxvo gateway and inspect responses."
      />

      {!isAuthenticated && (
        <Notice tone="neutral" title="Connect a wallet to run requests">
          The playground works best with an API key from your project. Connect to get started.
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr_280px]">
        {/* Left: Method selector */}
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)] xl:self-start">
          <CardHeader>
            <CardTitle>Methods</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--fyxvo-border)] px-4 pb-0 pt-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "border-[var(--fyxvo-brand)] text-[var(--fyxvo-text)]"
                      : "border-transparent text-[var(--fyxvo-text-muted)] hover:text-[var(--fyxvo-text)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-0.5 p-2">
              {RPC_METHODS.filter((m) => m.category === selectedCategory).map((m) => (
                <button
                  key={m.method}
                  onClick={() => selectMethod(m)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedMethod.method === m.method
                      ? "bg-brand-500/10 text-[var(--fyxvo-text)] font-medium"
                      : "text-[var(--fyxvo-text-muted)] hover:bg-[var(--fyxvo-panel-soft)] hover:text-[var(--fyxvo-text)]"
                  }`}
                >
                  {m.method}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center: Request builder + response */}
        <div className="space-y-4 min-w-0">
          <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-mono text-base">{selectedMethod.method}</CardTitle>
                  <p className="mt-1 text-sm text-[var(--fyxvo-text-muted)]">{selectedMethod.description}</p>
                </div>
                <Badge tone="neutral">{selectedMethod.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode selector */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--fyxvo-text-muted)]">Mode</p>
                <div className="flex gap-2">
                  {(["standard", "priority"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        mode === m
                          ? "border-brand-500/50 bg-brand-500/10 text-[var(--fyxvo-text)]"
                          : "border-[var(--fyxvo-border)] text-[var(--fyxvo-text-muted)] hover:text-[var(--fyxvo-text)]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* API key selector */}
              {portal.apiKeys.filter((k) => k.status === "ACTIVE").length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--fyxvo-text-muted)]">API Key</p>
                  <select
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 py-2 text-sm text-[var(--fyxvo-text)] focus:outline-none focus:ring-1 focus:ring-[var(--fyxvo-accent)]"
                  >
                    <option value="">Auto-select active key</option>
                    {portal.apiKeys.filter((k) => k.status === "ACTIVE").map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.prefix}… {k.label ? `— ${k.label}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Params */}
              {selectedMethod.params.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--fyxvo-text-muted)]">Parameters</p>
                  {selectedMethod.params.map((param) => (
                    <div key={param.name}>
                      <label className="mb-1 block text-xs font-medium text-[var(--fyxvo-text)]">
                        {param.name}
                        {param.required && <span className="ml-1 text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={paramValues[param.name] ?? ""}
                        onChange={(e) => setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))}
                        placeholder={param.placeholder}
                        className="w-full rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 py-2 font-mono text-sm text-[var(--fyxvo-text)] placeholder:text-[var(--fyxvo-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--fyxvo-accent)]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => void sendRequest()}
                disabled={loading || !isAuthenticated}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending…
                  </span>
                ) : "Send Request"}
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          {(response !== null || error !== null) && (
            <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Response</CardTitle>
                  <div className="flex items-center gap-2">
                    {durationMs !== null && (
                      <Badge tone="neutral">{durationMs}ms</Badge>
                    )}
                    {response !== null && (
                      <button
                        onClick={() => void navigator.clipboard.writeText(response)}
                        className="text-xs text-[var(--fyxvo-text-muted)] hover:text-[var(--fyxvo-text)] transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error ? (
                  <Notice tone="warning" title="Request failed">{error}</Notice>
                ) : (
                  <pre className="overflow-x-auto rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg)] p-4 text-xs text-[var(--fyxvo-text)] max-h-96">
                    <code>{response}</code>
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Request history */}
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)] xl:self-start">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>History</CardTitle>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-[var(--fyxvo-text-muted)] hover:text-[var(--fyxvo-text)] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--fyxvo-text-muted)]">No requests yet</p>
            ) : (
              <div className="divide-y divide-[var(--fyxvo-border)]">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const m = RPC_METHODS.find((r) => r.method === item.method);
                      if (m) selectMethod(m);
                    }}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-[var(--fyxvo-panel-soft)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-medium text-[var(--fyxvo-text)]">{item.method}</span>
                      <Badge tone={item.statusCode < 300 ? "success" : "warning"}>{item.statusCode}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--fyxvo-text-muted)]">
                      <span>{item.durationMs}ms</span>
                      <span className="capitalize">{item.mode}</span>
                      <span>{item.requestedAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
