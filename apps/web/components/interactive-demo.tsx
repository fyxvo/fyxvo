"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Demo step definitions
// ---------------------------------------------------------------------------

interface DemoStep {
  readonly id: number;
  readonly label: string;
  readonly content: ReactNode;
}

// ---------------------------------------------------------------------------
// Step content components
// ---------------------------------------------------------------------------

function StepCreateProject() {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]">Project</div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-[var(--fyxvo-text)]">My dApp</p>
          <p className="mt-1 font-mono text-xs text-[var(--fyxvo-text-muted)]">
            https://rpc.fyxvo.com/rpc?project=my-dapp
          </p>
        </div>
        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Active
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Environment", value: "development" },
          { label: "Network", value: "Solana devnet" },
          { label: "Status", value: "On-chain" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-[var(--fyxvo-text-muted)]">{item.label}</p>
            <p className="mt-0.5 text-xs font-medium text-[var(--fyxvo-text)]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepFund() {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]">Balance</div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-3xl font-semibold text-[var(--fyxvo-text)]">0.05 SOL</p>
          <p className="mt-1 text-sm text-[var(--fyxvo-text-muted)]">~50,000 requests at standard rate</p>
        </div>
        <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
          funded
        </span>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-[var(--fyxvo-text-muted)]">
          <span>Credit utilization</span>
          <span>12%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--fyxvo-panel-soft)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: "12%",
              background: "linear-gradient(90deg, var(--color-brand-400, #818cf8), var(--color-brand-500, #6366f1))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StepApiKey() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText("fyxvo_live_abc123...").then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]">API Key</div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3">
        <span className="font-mono text-sm text-[var(--fyxvo-text)]">fyxvo_live_abc123...</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-[var(--fyxvo-border)] px-3 py-1 text-xs font-medium text-[var(--fyxvo-text-muted)] transition hover:text-[var(--fyxvo-text)]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          { label: "Scopes", value: "standard, priority" },
          { label: "Status", value: "Active" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fyxvo-text-muted)]">{item.label}</p>
            <p className="mt-0.5 text-xs font-medium text-[var(--fyxvo-text)]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepRequest() {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]">Request</div>
      <div className="overflow-hidden rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)]">
        <div className="border-b border-[var(--fyxvo-border)] px-4 py-2">
          <span className="text-xs text-[var(--fyxvo-text-muted)]">curl · Standard RPC</span>
        </div>
        <pre className="overflow-x-auto p-3 text-xs leading-5 text-[var(--fyxvo-text-soft)]">
          <code>{`curl -X POST https://rpc.fyxvo.com/rpc \\
  -H "x-api-key: fyxvo_live_abc123..." \\
  -H "content-type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,
       "method":"getSlot","params":[]}'`}</code>
        </pre>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)]">
        <div className="border-b border-[var(--fyxvo-border)] px-4 py-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">200 OK · 38ms</span>
        </div>
        <pre className="overflow-x-auto p-3 text-xs leading-5 text-[var(--fyxvo-text-soft)]">
          <code>{`{"jsonrpc":"2.0","id":1,"result":285471234}`}</code>
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini CSS bar chart for analytics step
// ---------------------------------------------------------------------------

const ANALYTICS_BARS = [
  { hour: "6am", count: 87 },
  { hour: "9am", count: 214 },
  { hour: "12pm", count: 312 },
  { hour: "3pm", count: 289 },
  { hour: "6pm", count: 122 },
];

function StepAnalytics() {
  const max = Math.max(...ANALYTICS_BARS.map((b) => b.count));
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fyxvo-text-muted)]">Analytics</span>
        <span className="text-xs font-semibold text-[var(--fyxvo-text)]">1,024 requests today</span>
      </div>
      <div
        className="flex items-end gap-2 rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-4"
        style={{ height: 88 }}
      >
        {ANALYTICS_BARS.map((bar) => (
          <div key={bar.hour} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(4, Math.round((bar.count / max) * 52))}px`,
                background: "linear-gradient(180deg, var(--color-brand-400, #818cf8), var(--color-brand-500, #6366f1))",
              }}
            />
            <span className="text-[9px] text-[var(--fyxvo-text-muted)]">{bar.hour}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Avg latency", value: "42ms" },
          { label: "Success rate", value: "99.8%" },
          { label: "API keys", value: "2 active" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-2 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[var(--fyxvo-text-muted)]">{item.label}</p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--fyxvo-text)]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DEMO_STEPS: DemoStep[] = [
  { id: 1, label: "Create a Project", content: <StepCreateProject /> },
  { id: 2, label: "Fund It", content: <StepFund /> },
  { id: 3, label: "Get an API Key", content: <StepApiKey /> },
  { id: 4, label: "Make a Request", content: <StepRequest /> },
  { id: 5, label: "View Analytics", content: <StepAnalytics /> },
];

export function InteractiveDemo() {
  const [activeStep, setActiveStep] = useState(1);
  const current = DEMO_STEPS.find((s) => s.id === activeStep) ?? DEMO_STEPS[0];

  return (
    <div className="rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-6 md:p-8">
      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {DEMO_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
              activeStep === step.id
                ? "bg-brand-500 text-white"
                : "border border-[var(--fyxvo-border)] text-[var(--fyxvo-text-muted)] hover:text-[var(--fyxvo-text)]"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                activeStep === step.id ? "bg-white/20" : "bg-[var(--fyxvo-border)]"
              }`}
            >
              {step.id}
            </span>
            {step.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[220px]">{current?.content}</div>

      {/* Navigation + CTA */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
            className="rounded-lg border border-[var(--fyxvo-border)] px-3 py-1.5 text-xs font-medium text-[var(--fyxvo-text-muted)] transition hover:text-[var(--fyxvo-text)] disabled:opacity-30"
          >
            ← Prev
          </button>
          <button
            type="button"
            disabled={activeStep === DEMO_STEPS.length}
            onClick={() => setActiveStep((s) => Math.min(DEMO_STEPS.length, s + 1))}
            className="rounded-lg border border-[var(--fyxvo-border)] px-3 py-1.5 text-xs font-medium text-[var(--fyxvo-text-muted)] transition hover:text-[var(--fyxvo-text)] disabled:opacity-30"
          >
            Next →
          </button>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Create your free account →
        </Link>
      </div>
    </div>
  );
}
