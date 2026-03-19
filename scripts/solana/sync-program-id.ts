import process from "node:process";
import { ensureProgramKeypair, loadSolanaScriptRuntime, syncProgramIdInRepo } from "./shared.js";

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const { keypair, programId } = await ensureProgramKeypair(runtime, {
    createIfMissing: process.argv.includes("--generate")
  });

  await syncProgramIdInRepo(programId);

  process.stdout.write(
    JSON.stringify(
      {
        programId,
        programKeypairPath: runtime.programKeypairPath,
        generated: process.argv.includes("--generate"),
        publicKey: keypair.publicKey.toBase58()
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
