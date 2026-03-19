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
  compact = false
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
            source: compact ? "header-compact" : "header-primary"
          });
        }}
        loading={portal.walletPhase === "connecting" || portal.walletPhase === "authenticating"}
      >
        {compact ? "Connect" : "Connect wallet"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Connect a Solana wallet"
        description="Phantom, Solflare, Backpack, and Wallet Standard compatible wallets can all authenticate the same Fyxvo session."
      >
        <div className="space-y-3">
          {portal.walletOptions.map((wallet) => (
            <button
              key={wallet.name}
              type="button"
              onClick={async () => {
                setConnectingWallet(wallet.name);
                try {
                  await portal.connectWallet(wallet.name);
                  setOpen(false);
                } finally {
                  setConnectingWallet(null);
                }
              }}
              className="flex w-full items-center justify-between rounded-[1.6rem] border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-4 text-left transition hover:border-brand-500/40 hover:bg-[var(--fyxvo-panel)]"
            >
              <div>
                <div className="text-base font-medium text-[var(--fyxvo-text)]">{wallet.name}</div>
                <div className="mt-1 text-sm text-[var(--fyxvo-text-muted)]">
                  {wallet.installed
                    ? "Ready in this browser"
                    : "Use a compatible extension or Wallet Standard provider"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={walletTone(wallet.readyState)}>{wallet.readyState}</Badge>
                {connectingWallet === wallet.name ? (
                  <span className="text-sm text-[var(--fyxvo-text-muted)]">Connecting…</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
