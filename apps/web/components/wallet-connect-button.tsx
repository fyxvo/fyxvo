"use client";

import { useState } from "react";
import { Badge, Button, Modal } from "@fyxvo/ui";
import { trackLaunchEvent } from "../lib/tracking";
import { usePortal } from "./portal-provider";

function walletTone(readyState: string) {
  if (readyState === "Installed" || readyState === "Loadable") {
    return "success" as const;
  }
  return "neutral" as const;
}

export function WalletConnectButton({
  className,
  compact = false,
}: {
  readonly className?: string;
  readonly compact?: boolean;
}) {
  const portal = usePortal();
  const [open, setOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  return (
    <>
      <Button
        className={className}
        onClick={() => {
          setOpen(true);
          void trackLaunchEvent({
            name: "wallet_connect_intent",
            source: compact ? "header-compact" : "header-primary",
          });
        }}
        loading={
          portal.walletPhase === "connecting" || portal.walletPhase === "authenticating"
        }
      >
        {compact ? "Connect" : "Connect wallet"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Connect a Solana wallet"
        description="Choose a wallet to authenticate your Fyxvo session. Phantom, Solflare, Backpack, Coinbase Wallet, Trust Wallet, and Wallet Standard compatible wallets are supported."
      >
        <div className="space-y-2">
          {portal.walletOptions.map((wallet) => (
            <button
              key={wallet.name}
              type="button"
              disabled={connectingWallet !== null}
              onClick={async () => {
                setConnectingWallet(wallet.name);
                try {
                  await portal.connectWallet(wallet.name);
                  setOpen(false);
                } finally {
                  setConnectingWallet(null);
                }
              }}
              className="flex w-full items-center gap-4 rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3 text-left transition hover:border-brand-500/40 hover:bg-[var(--fyxvo-panel)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {wallet.icon ? (
                <img
                  src={wallet.icon}
                  alt={`${wallet.name} logo`}
                  className="h-9 w-9 shrink-0 rounded-xl object-contain"
                  aria-hidden="true"
                />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-xl bg-[var(--fyxvo-panel)] ring-1 ring-[var(--fyxvo-border)]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--fyxvo-text)]">
                  {wallet.name}
                </div>
                <div className="mt-0.5 text-xs text-[var(--fyxvo-text-muted)]">
                  {wallet.installed
                    ? "Ready in this browser"
                    : "Not detected — install the extension to connect"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={walletTone(wallet.readyState)}>{wallet.readyState}</Badge>
                {connectingWallet === wallet.name ? (
                  <span className="text-xs text-[var(--fyxvo-text-muted)]">Connecting…</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--fyxvo-text-muted)]">
          Wallet Standard compatible wallets are detected automatically. Fyxvo never stores private
          keys.
        </p>
      </Modal>
    </>
  );
}
