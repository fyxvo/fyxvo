import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@fyxvo/ui";
import { webEnv } from "../../../lib/env";

export const metadata: Metadata = {
  title: "Join Fyxvo",
  description: "You've been invited to Fyxvo — the fastest Solana RPC gateway for builders.",
};

export default async function JoinPage({
  params,
}: {
  readonly params: { code: string };
}) {
  const { code } = params;

  // Record the click server-side (fire-and-forget, best effort)
  try {
    await fetch(new URL(`/v1/referral/click/${code}`, webEnv.apiBaseUrl), {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    // Non-fatal
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--fyxvo-bg)] p-6">
      <Card className="fyxvo-surface w-full max-w-md border-[color:var(--fyxvo-border)]">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <span className="text-5xl">⚡</span>
          </div>
          <CardTitle className="text-2xl">You've been invited to Fyxvo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-[var(--fyxvo-text-soft)]">
            Fyxvo is a funded Solana RPC gateway for serious builders. Priority relay, real analytics,
            on-chain billing — all from a single API key.
          </p>

          <div className="grid gap-3 text-left">
            {[
              { icon: "🔑", title: "API key management", body: "Scoped keys with revocation and rotation." },
              { icon: "📊", title: "Real analytics", body: "Per-project request logs, latency, and error breakdown." },
              { icon: "⚡", title: "Priority relay", body: "Low-latency paths for DeFi and time-sensitive transactions." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-4">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--fyxvo-text)]">{item.title}</p>
                  <p className="text-xs text-[var(--fyxvo-text-muted)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <Button asChild className="w-full">
            <Link href="/">Get started →</Link>
          </Button>

          <p className="text-xs text-[var(--fyxvo-text-muted)]">
            Referred by a Fyxvo user · Devnet private alpha
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
