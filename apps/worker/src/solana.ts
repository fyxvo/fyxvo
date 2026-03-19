import {
  type Finality,
  PublicKey,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
  type PartiallyDecodedInstruction
} from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import type {
  NativeBalanceSnapshot,
  NodeHealthObservation,
  NodeProbeClient,
  ParsedTransactionRecord,
  SignatureSummary,
  SolanaIndexerClient,
  TokenBalanceSnapshot
} from "./types.js";

const DEFAULT_FINALITY: Finality = "confirmed";
const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

function toDate(blockTime: number | null | undefined): Date | null {
  return typeof blockTime === "number" ? new Date(blockTime * 1_000) : null;
}

function toRecord<T>(value: T): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(value, (_key, candidate) =>
      typeof candidate === "bigint" ? candidate.toString() : candidate
    )
  ) as Record<string, unknown>;
}

function classifyInstruction(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): string | null {
  if ("parsed" in instruction && instruction.parsed && typeof instruction.parsed === "object") {
    const parsed = instruction.parsed as { type?: unknown };
    if (typeof parsed.type === "string") {
      if (instruction.program === "system" && parsed.type.toLowerCase().includes("transfer")) {
        return "SOL_TRANSFER";
      }

      if (instruction.program === "spl-token" && parsed.type.toLowerCase().includes("transfer")) {
        return "TOKEN_TRANSFER";
      }

      return parsed.type.toUpperCase();
    }
  }

  return null;
}

function classifyTransaction(transaction: ParsedTransactionWithMeta): string {
  const instructions = transaction.transaction.message.instructions;
  for (const instruction of instructions) {
    const activityType = classifyInstruction(instruction);
    if (activityType) {
      return activityType;
    }
  }

  return instructions.length > 1 ? "COMPLEX" : "UNKNOWN";
}

export class RpcSolanaIndexerClient implements SolanaIndexerClient {
  constructor(private readonly connection: Connection) {}

  async getSignaturesForAddress(
    walletAddress: string,
    limit: number
  ): Promise<readonly SignatureSummary[]> {
    const signatures = await this.connection.getSignaturesForAddress(
      new PublicKey(walletAddress),
      { limit },
      DEFAULT_FINALITY
    );

    return signatures.map((signature) => ({
      signature: signature.signature,
      slot: BigInt(signature.slot),
      err: signature.err,
      blockTime: toDate(signature.blockTime)
    }));
  }

  async getParsedTransaction(signature: string): Promise<ParsedTransactionRecord | null> {
    const transaction = await this.connection.getParsedTransaction(signature, {
      commitment: DEFAULT_FINALITY,
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return null;
    }

    const status = transaction.meta?.err ? "FAILED" : "CONFIRMED";

    return {
      signature,
      slot: BigInt(transaction.slot),
      blockTime: toDate(transaction.blockTime),
      status,
      activityType: classifyTransaction(transaction),
      raw: toRecord(transaction)
    };
  }

  async getNativeBalance(walletAddress: string): Promise<NativeBalanceSnapshot> {
    const balance = await this.connection.getBalance(new PublicKey(walletAddress), DEFAULT_FINALITY);
    return {
      mintAddress: SOL_MINT_ADDRESS,
      amount: balance.toString(),
      decimals: 9
    };
  }

  async getTokenBalances(walletAddress: string): Promise<readonly TokenBalanceSnapshot[]> {
    const response = await this.connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: TOKEN_PROGRAM_ID
      },
      DEFAULT_FINALITY
    );

    return response.value.map(({ account }) => {
      const parsed = account.data.parsed as {
        info?: {
          mint?: string;
          tokenAmount?: {
            amount?: string;
            decimals?: number;
          };
        };
      };

      return {
        mintAddress: parsed.info?.mint ?? "unknown",
        amount: parsed.info?.tokenAmount?.amount ?? "0",
        decimals: parsed.info?.tokenAmount?.decimals ?? 0
      };
    });
  }
}

export class JsonRpcNodeProbeClient implements NodeProbeClient {
  private async rpcRequest(
    endpoint: string,
    method: string,
    timeoutMs: number
  ): Promise<Record<string, unknown>> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: method,
        method
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Node returned ${response.status}.`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    return body;
  }

  async probe(endpoint: string, timeoutMs: number): Promise<NodeHealthObservation> {
    const startedAt = Date.now();

    try {
      const health = await this.rpcRequest(endpoint, "getHealth", timeoutMs);
      if ("error" in health) {
        const error = health.error;
        return {
          isHealthy: false,
          latencyMs: Date.now() - startedAt,
          responseSlot: null,
          errorMessage:
            typeof error === "object" && error !== null && "message" in error
              ? String(error.message)
              : "Node reported unhealthy status."
        };
      }

      const slotResponse = await this.rpcRequest(endpoint, "getSlot", timeoutMs);
      const slotValue = typeof slotResponse.result === "number" ? BigInt(slotResponse.result) : null;

      return {
        isHealthy: true,
        latencyMs: Date.now() - startedAt,
        responseSlot: slotValue,
        errorMessage: null
      };
    } catch (error) {
      return {
        isHealthy: false,
        latencyMs: Date.now() - startedAt,
        responseSlot: null,
        errorMessage: error instanceof Error ? error.message : "Unknown node probe failure."
      };
    }
  }
}
