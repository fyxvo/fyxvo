import process from "node:process";
import { createDevnetConnection, fetchReadiness, loadSolanaScriptRuntime, printReadiness } from "./shared.js";

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const connection = createDevnetConnection(runtime);
  const readiness = await fetchReadiness(runtime, connection);
  printReadiness(readiness);

  if (!readiness.ready) {
    process.exit(1);
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
