import process from "node:process";
import {
  createAnchorCliEnv,
  ensureProgramKeypair,
  loadSolanaScriptRuntime,
  runCommand,
  syncProgramIdInRepo
} from "./shared.js";

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const { programId } = await ensureProgramKeypair(runtime, {
    createIfMissing: process.argv.includes("--generate-program-id")
  });

  await syncProgramIdInRepo(programId);
  await runCommand("anchor", ["build"], createAnchorCliEnv(runtime));

  process.stdout.write(
    JSON.stringify(
      {
        status: "built",
        programId,
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
