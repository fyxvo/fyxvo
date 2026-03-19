"use client";

import { useMemo, type PropsWithChildren } from "react";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import {
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { webEnv } from "../lib/env";

export function SolanaProvider({ children }: PropsWithChildren) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={webEnv.solanaRpcUrl}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
