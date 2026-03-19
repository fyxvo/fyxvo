import type { WorkerEnv } from "@fyxvo/config";
import type {
  SignatureSummary,
  TokenBalanceSnapshot,
  WorkerJobResult,
  WorkerLogger,
  WorkerRepository,
  SolanaIndexerClient,
  WalletIndexTarget
} from "../types.js";
import { workerJobNames } from "../types.js";

interface WalletCursor {
  readonly lastSignature: string;
}

function walletCursorKey(walletAddress: string): string {
  return `${workerJobNames.walletIndexing}:${walletAddress}`;
}

function takeNewSignatures(
  signatures: readonly SignatureSummary[],
  lastSignature: string | null
): readonly SignatureSummary[] {
  if (!lastSignature) {
    return [...signatures].reverse();
  }

  const stopIndex = signatures.findIndex((signature) => signature.signature === lastSignature);
  const next = stopIndex >= 0 ? signatures.slice(0, stopIndex) : signatures;
  return [...next].reverse();
}

async function syncWalletTarget(input: {
  readonly env: WorkerEnv;
  readonly target: WalletIndexTarget;
  readonly repository: WorkerRepository;
  readonly indexer: SolanaIndexerClient;
  readonly logger: WorkerLogger;
}) {
  const cursor =
    (await input.repository.getCursor<WalletCursor>(walletCursorKey(input.target.walletAddress))) ??
    null;
  const signatures = await input.indexer.getSignaturesForAddress(
    input.target.walletAddress,
    input.env.WORKER_SIGNATURE_BATCH_SIZE
  );
  const newSignatures = takeNewSignatures(signatures, cursor?.lastSignature ?? null);

  for (const signature of newSignatures) {
    const transaction = await input.indexer.getParsedTransaction(signature.signature);
    const raw = transaction?.raw ?? {
      signature: signature.signature,
      slot: signature.slot.toString()
    };
    const status = transaction?.status ?? (signature.err ? "FAILED" : "CONFIRMED");
    const blockTime = transaction?.blockTime ?? signature.blockTime;

    await input.repository.upsertTransactionLookup({
      signature: signature.signature,
      slot: transaction?.slot ?? signature.slot,
      status,
      blockTime,
      raw
    });

    await input.repository.upsertWalletActivity({
      walletAddress: input.target.walletAddress,
      signature: signature.signature,
      activityType: transaction?.activityType ?? "UNKNOWN",
      slot: transaction?.slot ?? signature.slot,
      blockTime,
      success: status === "CONFIRMED",
      projectId: input.target.projectId,
      source: input.target.source,
      raw
    });
  }

  const nativeBalance = await input.indexer.getNativeBalance(input.target.walletAddress);
  const tokenBalances = await input.indexer.getTokenBalances(input.target.walletAddress);
  const balances: TokenBalanceSnapshot[] = [nativeBalance, ...tokenBalances];

  await input.repository.replaceWalletTokenBalances({
    walletAddress: input.target.walletAddress,
    projectId: input.target.projectId,
    balances
  });

  if (signatures[0]) {
    await input.repository.setCursor(walletCursorKey(input.target.walletAddress), {
      lastSignature: signatures[0].signature
    });
  }

  input.logger.debug(
    {
      walletAddress: input.target.walletAddress,
      newTransactions: newSignatures.length,
      balanceCount: balances.length
    },
    "Wallet indexing sync completed"
  );

  return {
    indexedTransactions: newSignatures.length,
    balanceCount: balances.length
  };
}

export async function processWalletIndexing(input: {
  readonly env: WorkerEnv;
  readonly repository: WorkerRepository;
  readonly indexer: SolanaIndexerClient;
  readonly logger: WorkerLogger;
}): Promise<WorkerJobResult> {
  const targets = await input.repository.listWalletTargets();
  let indexedTransactions = 0;
  let balanceCount = 0;

  for (const target of targets) {
    const result = await syncWalletTarget({
      env: input.env,
      target,
      repository: input.repository,
      indexer: input.indexer,
      logger: input.logger
    });
    indexedTransactions += result.indexedTransactions;
    balanceCount += result.balanceCount;
  }

  input.logger.info(
    {
      walletCount: targets.length,
      indexedTransactions,
      balanceCount
    },
    "Wallet indexing completed"
  );

  return {
    job: workerJobNames.walletIndexing,
    processed: targets.length,
    details: {
      indexedTransactions,
      balanceCount
    }
  };
}
