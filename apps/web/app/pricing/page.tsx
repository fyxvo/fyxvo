import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Notice } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";
import { InterestCaptureForm } from "../../components/interest-capture-form";
import { PricingEstimator } from "../../components/pricing-estimator";
import { TrackedLinkButton } from "../../components/tracked-link-button";
import { PRICING_LAMPORTS, PRICING_USDC, VOLUME_DISCOUNT, FREE_TIER_REQUESTS, REVENUE_SPLIT_BPS } from "@fyxvo/config";
import { webEnv } from "../../lib/env";

export const metadata: Metadata = {
  title: "Pricing — Fyxvo",
  description: "Devnet launch pricing for Fyxvo: SOL-funded standard RPC and priority relay, lamport-per-request rates, volume discounts, and on-chain funding mechanics for early teams.",
  openGraph: {
    title: "Pricing — Fyxvo",
    description: "Devnet launch pricing for Fyxvo: SOL-funded standard RPC and priority relay, lamport-per-request rates, volume discounts, and on-chain funding mechanics for early teams.",
    images: [{ url: webEnv.socialImageUrl }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Fyxvo",
    description: "Devnet launch pricing for Fyxvo: SOL-funded standard RPC and priority relay, lamport-per-request rates, volume discounts, and on-chain funding mechanics for early teams.",
    images: [webEnv.socialImageUrl]
  }
};

function lamportsToSol(lamports: number) {
  return (lamports / 1_000_000_000).toFixed(6);
}

function usdcUnitsToDisplay(units: number) {
  return (units / 1_000_000).toFixed(4);
}

async function fetchSolPriceUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { solana?: { usd?: number } };
    return data.solana?.usd ?? null;
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const solPriceUsd = await fetchSolPriceUsd();

  const tiers = [
    {
      name: "Standard RPC",
      tag: "standard",
      lamports: PRICING_LAMPORTS.standard,
      usdc: PRICING_USDC.standard,
      description: "All standard JSON-RPC reads: getBalance, getAccountInfo, getBlock, getTransaction, etc.",
      what: "API-key validation, funded balance enforcement, Redis-backed rate limiting, multi-node routing with fallback, request logging, and analytics rollups."
    },
    {
      name: "Compute-heavy",
      tag: "compute-heavy",
      lamports: PRICING_LAMPORTS.computeHeavy,
      usdc: PRICING_USDC.computeHeavy,
      description: "High-CPU methods: getProgramAccounts, getTokenAccountsByOwner, getSignaturesForAddress, getMultipleAccounts, and related.",
      what: "Same routing as standard, but priced separately to reflect upstream compute cost for resource-intensive queries."
    },
    {
      name: "Priority relay",
      tag: "priority",
      lamports: PRICING_LAMPORTS.priority,
      usdc: PRICING_USDC.priority,
      description: "The /priority endpoint: faster routing mode, separate rate window, distinct per-request pricing from the standard path.",
      what: "Separate routing mode. Priority mode is explicit — it is not a hidden fast lane of the standard path."
    }
  ] as const;

  return (
    <div className="space-y-10 lg:space-y-12">
      <PageHeader
        eyebrow="Pricing"
        title="Devnet launch pricing for early teams running real Solana traffic."
        description="Three tiers. Lamport-per-request pricing. On-chain funding. Volume discounts at 1M and 10M requests per month."
        actions={
          <>
            <TrackedLinkButton
              href="/docs"
              eventName="landing_cta_clicked"
              eventSource="pricing-header-docs"
            >
              Open quickstart
            </TrackedLinkButton>
            <TrackedLinkButton
              href="/contact"
              eventName="landing_cta_clicked"
              eventSource="pricing-header-contact"
              variant="secondary"
            >
              Request founder follow-up
            </TrackedLinkButton>
          </>
        }
      />

      {solPriceUsd != null ? (
        <div className="flex items-center gap-2 text-sm text-[var(--fyxvo-text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          SOL price (live): <span className="font-medium text-[var(--fyxvo-text)]">${solPriceUsd.toFixed(2)}</span>
          <span className="text-xs opacity-60">via CoinGecko</span>
        </div>
      ) : null}

      {/* Three pricing tiers */}
      <section className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => {
          const solPerRequest = lamportsToSol(tier.lamports);
          const usdPerRequest = solPriceUsd != null
            ? `~$${((tier.lamports / 1_000_000_000) * solPriceUsd).toFixed(6)}`
            : null;

          return (
            <Card key={tier.tag} className="fyxvo-surface border-[color:var(--fyxvo-border)]">
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.6rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-5 space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">SOL</div>
                    <div className="mt-1 text-2xl font-semibold text-[var(--fyxvo-text)]">
                      {tier.lamports.toLocaleString()} lam
                    </div>
                    <div className="text-sm text-[var(--fyxvo-text-muted)]">{solPerRequest} SOL per request</div>
                    {usdPerRequest ? (
                      <div className="text-xs text-[var(--fyxvo-text-muted)]">{usdPerRequest} USD per request</div>
                    ) : null}
                  </div>
                  <div className="border-t border-[color:var(--fyxvo-border)] pt-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--fyxvo-text-muted)]">USDC (gated)</div>
                    <div className="mt-1 text-sm text-[var(--fyxvo-text-soft)]">
                      {tier.usdc.toLocaleString()} units · {usdcUnitsToDisplay(tier.usdc)} USDC per request
                    </div>
                  </div>
                </div>
                <Notice tone="neutral" title="What this includes">
                  {tier.what}
                </Notice>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Free tier + volume discounts */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Free tier</CardTitle>
            <CardDescription>Every new project starts with complimentary requests on devnet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[1.6rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-5">
              <div className="text-3xl font-semibold text-[var(--fyxvo-text)]">
                {FREE_TIER_REQUESTS.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-[var(--fyxvo-text-muted)]">standard requests per new project, no funding required</p>
            </div>
            <p className="text-sm text-[var(--fyxvo-text-soft)] leading-6">
              Activate your project, issue an API key, and route up to {FREE_TIER_REQUESTS.toLocaleString()} standard devnet requests without depositing SOL. Compute-heavy and priority requests are not included in the free tier.
            </p>
          </CardContent>
        </Card>

        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Volume discounts</CardTitle>
            <CardDescription>Automatic discounts applied at threshold crossing. No negotiation required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: `≥${(VOLUME_DISCOUNT.tier1.monthlyRequests / 1_000_000).toFixed(0)}M req/month`,
                discount: `${VOLUME_DISCOUNT.tier1.discountBps / 100}% off`,
                detail: "20% reduction across all tiers"
              },
              {
                label: `≥${(VOLUME_DISCOUNT.tier2.monthlyRequests / 1_000_000).toFixed(0)}M req/month`,
                discount: `${VOLUME_DISCOUNT.tier2.discountBps / 100}% off`,
                detail: "40% reduction across all tiers"
              }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[1rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--fyxvo-text)]">{item.label}</div>
                  <div className="text-xs text-[var(--fyxvo-text-muted)]">{item.detail}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{item.discount}</div>
              </div>
            ))}
            <p className="text-sm text-[var(--fyxvo-text-soft)] leading-6">
              Discounts apply to the per-request lamport cost at the time of the request. No billing cycle delays.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Revenue split */}
      <section>
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Revenue split</CardTitle>
            <CardDescription>Every request fee is split on-chain between node operators, the protocol treasury, and infrastructure funding.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Node operators", bps: REVENUE_SPLIT_BPS.nodeOperators, color: "bg-brand-500" },
                { label: "Protocol treasury", bps: REVENUE_SPLIT_BPS.protocolTreasury, color: "bg-emerald-500" },
                { label: "Infrastructure fund", bps: REVENUE_SPLIT_BPS.infraFund, color: "bg-sky-500" }
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4">
                  <div className={`h-2 w-8 rounded-full ${item.color} mb-3`} />
                  <div className="text-2xl font-semibold text-[var(--fyxvo-text)]">{item.bps / 100}%</div>
                  <div className="mt-1 text-sm text-[var(--fyxvo-text-muted)]">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cost estimator + interest form */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PricingEstimator solPriceUsd={solPriceUsd} />

        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>How funding works</CardTitle>
            <CardDescription>
              Fyxvo is funded on chain, not through an off-platform invoice abstraction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Activate project",
                  body: "Create the project and confirm the activation transaction so the on-chain project account exists.",
                },
                {
                  title: "2. Fund with SOL",
                  body: "Prepare and sign a SOL funding transaction. The API verifies the signature and refreshes spendable balance.",
                },
                {
                  title: "3. Spend through the gateway",
                  body: "Requests are priced by tier and method, then deducted against the on-chain-backed project balance.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-[color:var(--fyxvo-border)] bg-[color:var(--fyxvo-panel-soft)] p-4"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                    {item.title}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--fyxvo-text-soft)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <Notice tone="success" title="SOL is the live funding path">
              SOL funding is live on devnet today.
            </Notice>
            <Notice tone="neutral" title="USDC stays gated">
              USDC remains configuration-gated until the deployment explicitly enables it.
            </Notice>
          </CardContent>
        </Card>
      </section>

      <InterestCaptureForm
        source="pricing-page"
        title="Plan rollout, volume, or founder review"
        description="Use this form when the team wants higher-volume devnet planning, priority relay review, analytics visibility, or a managed rollout conversation."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Who this is for</CardTitle>
            <CardDescription>
              Early teams that want a real devnet relay path, not a mock dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-[var(--fyxvo-text-soft)]">
            This is a good fit for teams validating wallet-authenticated project control, funded
            JSON-RPC, priority relay behavior, analytics visibility, and managed launch operations
            before broader rollout.
          </CardContent>
        </Card>
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>What you can expect</CardTitle>
            <CardDescription>
              Clean project activation, SOL funding, API keys, relay access, and honest status surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-[var(--fyxvo-text-soft)]">
            The product does not claim fake production adoption or a finished mainnet commercial
            model. It gives early users a credible devnet path and enough visibility to evaluate fit.
          </CardContent>
        </Card>
        <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
          <CardHeader>
            <CardTitle>Useful next links</CardTitle>
            <CardDescription>
              Pick the path that matches how far you want to go today.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <TrackedLinkButton
              href="/docs"
              eventName="landing_cta_clicked"
              eventSource="pricing-links-docs"
              variant="secondary"
            >
              Open quickstart
            </TrackedLinkButton>
            <TrackedLinkButton
              href="/dashboard"
              eventName="landing_cta_clicked"
              eventSource="pricing-links-dashboard"
              variant="secondary"
            >
              Open dashboard
            </TrackedLinkButton>
            <TrackedLinkButton
              href={webEnv.statusPageUrl}
              eventName="landing_cta_clicked"
              eventSource="pricing-links-status"
              variant="secondary"
            >
              View status
            </TrackedLinkButton>
            <TrackedLinkButton
              href="/contact"
              eventName="landing_cta_clicked"
              eventSource="pricing-links-contact"
              variant="secondary"
            >
              Contact Fyxvo
            </TrackedLinkButton>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
