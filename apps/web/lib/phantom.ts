"use client";

import { AddressType, BrowserSDK } from "@phantom/browser-sdk";
import bs58 from "bs58";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import { webEnv } from "./env";

let sdkInstance: BrowserSDK | null = null;

type PhantomSolanaSdk = {
  connect: () => Promise<unknown>;
  disconnect?: () => Promise<void>;
  getPublicKey?: () => Promise<string>;
  signMessage?: (message: Uint8Array | string) => Promise<Uint8Array | { signature: Uint8Array }>;
  signAndSendTransaction?: (
    transaction: VersionedTransaction
  ) => Promise<string | { hash?: string; signature?: string }>;
  switchNetwork?: (cluster: "devnet" | "mainnet-beta" | "testnet") => Promise<void>;
};

function createSdk() {
  if (sdkInstance) {
    return sdkInstance;
  }

  sdkInstance = new BrowserSDK({
    providers: ["injected"],
    addressTypes: [AddressType.solana]
  });

  return sdkInstance;
}

export function getPhantomSdk() {
  if (typeof window === "undefined") {
    return null;
  }

  return createSdk();
}

export function isPhantomAvailable() {
  return typeof window !== "undefined" && "phantom" in window;
}

async function getPublicKey(solana: PhantomSolanaSdk) {
  const publicKey = await solana.getPublicKey?.();
  if (!publicKey) {
    throw new Error("Phantom did not return a Solana public key.");
  }

  return publicKey;
}

function resolveSignature(result: Uint8Array | { signature: Uint8Array }) {
  return result instanceof Uint8Array ? result : result.signature;
}

export async function connectPhantomWallet() {
  const sdk = getPhantomSdk();
  if (!sdk) {
    throw new Error("Phantom is only available in the browser.");
  }

  await sdk.connect({ provider: "injected" });
  const solana = sdk.solana as unknown as PhantomSolanaSdk;
  const walletAddress = await getPublicKey(solana);

  return {
    sdk,
    solana,
    walletAddress
  };
}

export async function ensureDevnet(solana: PhantomSolanaSdk) {
  if (!solana.switchNetwork) {
    return false;
  }

  try {
    await solana.switchNetwork("devnet");
    return true;
  } catch {
    return false;
  }
}

export async function ensureInjectedPhantomDevnet() {
  const sdk = getPhantomSdk();
  if (!sdk) {
    return false;
  }

  const solana = sdk.solana as unknown as PhantomSolanaSdk;
  return ensureDevnet(solana);
}

export async function signAuthMessage(solana: PhantomSolanaSdk, message: string) {
  if (!solana.signMessage) {
    throw new Error("This Phantom wallet does not support message signing.");
  }

  const signed = await solana.signMessage(new TextEncoder().encode(message));
  return bs58.encode(resolveSignature(signed));
}

function base64ToUint8Array(value: string) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

export async function signAndSendPreparedTransaction(
  solana: PhantomSolanaSdk,
  transactionBase64: string
) {
  if (!solana.signAndSendTransaction) {
    throw new Error("This Phantom wallet does not support transaction submission.");
  }

  const transaction = VersionedTransaction.deserialize(base64ToUint8Array(transactionBase64));
  const submission = await solana.signAndSendTransaction(transaction);
  const signature =
    typeof submission === "string" ? submission : submission.signature ?? submission.hash ?? "";

  if (!signature) {
    throw new Error("Phantom did not return a transaction signature.");
  }

  const connection = new Connection(webEnv.solanaRpcUrl, "confirmed");
  await connection.confirmTransaction(signature, "confirmed");

  return {
    signature,
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  };
}

export async function disconnectPhantomWallet() {
  const sdk = getPhantomSdk();
  const solana = sdk?.solana as unknown as PhantomSolanaSdk | undefined;
  await solana?.disconnect?.();
}
