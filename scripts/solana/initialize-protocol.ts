import process from "node:process";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  DEFAULT_DEVNET_INIT_COMMAND,
  DEFAULT_DEVNET_VERIFY_COMMAND,
  buildInitializeProtocolInstruction,
  createDevnetConnection,
  fetchReadiness,
  loadKeypairFromFile,
  loadSolanaScriptRuntime,
  printReadiness,
  requireWalletFunding
} from "./shared.js";

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const connection = createDevnetConnection(runtime);
  const payer = await loadKeypairFromFile(runtime.anchorWalletPath);
  const readinessBefore = await fetchReadiness(runtime, connection);

  if (readinessBefore.ready) {
    printReadiness(readinessBefore);
    return;
  }

  if (readinessBefore.checks.protocolConfigExists) {
    throw new Error(
      [
        "Protocol accounts already exist on devnet but do not match the expected configuration.",
        "Resolve the mismatches below before rerunning initialization.",
        ...readinessBefore.reasons
      ].join("\n")
    );
  }

  if (!readinessBefore.checks.programDeployed || !readinessBefore.checks.programExecutable) {
    throw new Error(
      [
        "The Fyxvo program is not deployable yet because the program account is missing or not executable on devnet.",
        ...readinessBefore.reasons,
        `Run next: ${DEFAULT_DEVNET_INIT_COMMAND} after ${DEFAULT_DEVNET_VERIFY_COMMAND} succeeds.`
      ].join("\n")
    );
  }

  await requireWalletFunding({
    connection,
    wallet: payer.publicKey,
    minimumLamports: 500_000_000,
    nextCommand: DEFAULT_DEVNET_INIT_COMMAND
  });

  const adminAuthority = runtime.adminAuthority;
  const usdcMintAddress = runtime.usdcMintAddress;
  const { instruction } = buildInitializeProtocolInstruction({
    programId: new PublicKey(readinessBefore.addresses.programId),
    payer: payer.publicKey,
    adminAuthority: new PublicKey(adminAuthority),
    feeBps: runtime.feeBps,
    usdcMint: new PublicKey(usdcMintAddress)
  });

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer], {
    commitment: "confirmed"
  });
  const readinessAfter = await fetchReadiness(runtime, connection);

  process.stdout.write(
    JSON.stringify(
      {
        signature,
        readiness: readinessAfter
      },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ) + "\n"
  );

  if (!readinessAfter.ready) {
    throw new Error("Initialization transaction landed but the protocol is still not ready.");
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
