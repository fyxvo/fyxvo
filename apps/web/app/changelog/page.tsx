import type { Metadata } from "next";
import { Badge } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";
import { webEnv } from "../../lib/env";

export const metadata: Metadata = {
  title: "Changelog — Fyxvo",
  description: "Release notes and updates for the Fyxvo devnet control plane and relay gateway.",
  alternates: {
    canonical: `${webEnv.siteUrl}/changelog`,
  },
};

interface ChangeEntry {
  readonly type: "added" | "changed" | "fixed" | "removed";
  readonly text: string;
}

interface Release {
  readonly version: string;
  readonly date: string;
  readonly title: string;
  readonly description: string;
  readonly changes: ChangeEntry[];
}

const releases: Release[] = [
  {
    version: "v0.1.0",
    date: "March 2026",
    title: "Devnet Private Alpha",
    description:
      "The first public release of the Fyxvo control plane, relay gateway, and on-chain protocol. SOL-funded devnet RPC access, wallet-authenticated project management, and a full developer portal.",
    changes: [
      {
        type: "added",
        text: "Wallet-authenticated sessions via Phantom, Solflare, and compatible Solana wallets using challenge-response signing.",
      },
      {
        type: "added",
        text: "Project creation with on-chain activation via the Fyxvo Solana program deployed to devnet.",
      },
      {
        type: "added",
        text: "SOL funding flow: prepare, sign, and confirm funding transactions to load project treasury credits.",
      },
      {
        type: "added",
        text: "API key management with scoped credentials for standard RPC and priority relay access.",
      },
      {
        type: "added",
        text: "Funded relay gateway with standard RPC path and priority relay path, both scope-enforced.",
      },
      {
        type: "added",
        text: "Request logging, analytics aggregation, and latency tracking per project and API key.",
      },
      {
        type: "added",
        text: "In-app notifications for low balance, high request volume, and key events.",
      },
      {
        type: "added",
        text: "Live status page with real-time data from API and gateway health endpoints.",
      },
      {
        type: "added",
        text: "Command palette (⌘K) for fast navigation across all portal sections.",
      },
      {
        type: "added",
        text: "Transaction history with Solana Explorer links for all funding events.",
      },
      {
        type: "added",
        text: "Onboarding checklist tracking activation, funding, API key creation, and first relay request.",
      },
      {
        type: "added",
        text: "Dark and light mode with automatic system preference detection.",
      },
      {
        type: "added",
        text: "Docs section with quickstart, API reference, and funding mechanics.",
      },
      {
        type: "changed",
        text: "USDC funding path exists on-chain but remains configuration-gated during private alpha.",
      },
      {
        type: "changed",
        text: "Operator marketplace is managed infrastructure during private alpha — external operator onboarding is a planned next step.",
      },
      {
        type: "changed",
        text: "Authority control uses single-signer posture for devnet launch. Governed migration is on the roadmap.",
      },
    ],
  },
];

const toneMap: Record<ChangeEntry["type"], { label: string; color: string }> = {
  added: {
    label: "Added",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  },
  changed: {
    label: "Changed",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  },
  fixed: {
    label: "Fixed",
    color: "bg-brand-500/10 text-[var(--fyxvo-brand)] border border-brand-500/20",
  },
  removed: {
    label: "Removed",
    color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
  },
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <PageHeader
        eyebrow="Changelog"
        title="What's changed in Fyxvo."
        description="Release notes for the Fyxvo devnet control plane, relay gateway, and on-chain protocol. Private alpha updates ship as the product hardens toward mainnet readiness."
      />

      <div className="space-y-16">
        {releases.map((release) => (
          <article key={release.version} className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
              {/* Version sidebar */}
              <div className="sm:w-44 sm:shrink-0 sm:pt-1">
                <div className="sticky top-6 space-y-2">
                  <Badge tone="brand">{release.version}</Badge>
                  <p className="text-xs text-[var(--fyxvo-text-muted)]">{release.date}</p>
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--fyxvo-text)]">{release.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--fyxvo-text-soft)]">
                    {release.description}
                  </p>
                </div>

                <div className="space-y-3">
                  {release.changes.map((entry, idx) => {
                    const tone = toneMap[entry.type];
                    return (
                      <div
                        key={idx}
                        className="flex gap-3 rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3"
                      >
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.color}`}
                        >
                          {tone.label}
                        </span>
                        <p className="text-sm leading-6 text-[var(--fyxvo-text-soft)]">{entry.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-6 py-5">
        <p className="text-sm text-[var(--fyxvo-text-muted)]">
          Fyxvo is in private alpha on Solana devnet. Updates ship continuously as the protocol and
          gateway stack mature. Follow{" "}
          <a
            href="https://x.com/fyxvo"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--fyxvo-brand)] hover:underline"
          >
            @fyxvo
          </a>{" "}
          for announcements.
        </p>
      </div>
    </div>
  );
}
