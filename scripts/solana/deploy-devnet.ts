import process from "node:process";
import {
  DEFAULT_DEVNET_DEPLOY_COMMAND,
  createAnchorCliEnv,
  createDevnetConnection,
  ensureProgramKeypair,
  formatSol,
  getWalletBalance,
  loadKeypairFromFile,
  loadSolanaScriptRuntime,
  requireWalletFunding,
  runCommand,
  syncProgramIdInRepo
} from "./shared.js";

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const connection = createDevnetConnection(runtime);
  const deployer = await loadKeypairFromFile(runtime.anchorWalletPath);
  const { programId } = await ensureProgramKeypair(runtime, {
    createIfMissing: process.argv.includes("--generate-program-id")
  });

  await syncProgramIdInRepo(programId);
  const deployerBalance = await getWalletBalance(connection, deployer.publicKey);

  await requireWalletFunding({
    connection,
    wallet: deployer.publicKey,
    minimumLamports: 2 * 1_000_000_000,
    nextCommand: DEFAULT_DEVNET_DEPLOY_COMMAND
  });

  await runCommand("anchor", ["build"], createAnchorCliEnv(runtime));
  await runCommand(
    "anchor",
    ["deploy", "--provider.cluster", "devnet", "--provider.wallet", runtime.anchorWalletPath],
    createAnchorCliEnv(runtime)
  );

  const programInfo = await connection.getAccountInfo(
    (await ensureProgramKeypair(runtime)).keypair.publicKey,
    "confirmed"
  );
  if (!programInfo?.executable) {
    throw new Error(`Program ${programId} is still missing or not executable on devnet after deploy.`);
  }

  process.stdout.write(
    JSON.stringify(
      {
        status: "deployed",
        cluster: "devnet",
        programId,
        deployerWallet: deployer.publicKey.toBase58(),
        deployerBalance: formatSol(deployerBalance),
        programKeypairPath: runtime.programKeypairPath
      },
      null,
      2
    ) + "\n"
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
